import ExpoModulesCore

#if os(iOS)
import HealthKit
#endif

/// Pont Santé. Sur tvOS le module répond « unavailable » et n’importe pas HealthKit.
public class FamilyfitHealthModule: Module {
  #if os(iOS)
  private let store = HKHealthStore()
  #endif

  public func definition() -> ModuleDefinition {
    Name("FamilyfitHealth")

    AsyncFunction("requestPermissions") { (promise: Promise) in
      #if os(iOS)
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve("unavailable")
        return
      }
      guard let steps = HKObjectType.quantityType(forIdentifier: .stepCount) else {
        promise.resolve("unavailable")
        return
      }
      let share: Set<HKSampleType> = [HKObjectType.workoutType()]
      let read: Set<HKObjectType> = [steps]
      self.store.requestAuthorization(toShare: share, read: read) { ok, _ in
        promise.resolve(ok ? "granted" : "denied")
      }
      #else
      promise.resolve("unavailable")
      #endif
    }

    AsyncFunction("writeWorkout") { (startIso: String, endIso: String, title: String, promise: Promise) in
      #if os(iOS)
      guard let start = Self.date(startIso), let end = Self.date(endIso), end > start else {
        promise.resolve("failed")
        return
      }
      let workout = HKWorkout(
        activityType: .functionalStrengthTraining,
        start: start,
        end: end,
        duration: end.timeIntervalSince(start),
        totalEnergyBurned: nil,
        totalDistance: nil,
        metadata: [HKMetadataKeyWorkoutBrandName: "FamilyFit", HKMetadataKeyIndoorWorkout: true]
      )
      self.store.save(workout) { ok, _ in
        promise.resolve(ok ? "written" : "denied")
      }
      #else
      promise.resolve("unavailable")
      let _ = (startIso, endIso, title)
      #endif
    }

    AsyncFunction("readSteps") { (dayIso: String, promise: Promise) in
      #if os(iOS)
      guard let steps = HKQuantityType.quantityType(forIdentifier: .stepCount), let day = Self.day(dayIso) else {
        promise.resolve(nil)
        return
      }
      let end = Calendar.current.date(byAdding: .day, value: 1, to: day) ?? Date()
      let predicate = HKQuery.predicateForSamples(withStart: day, end: end, options: .strictStartDate)
      let query = HKStatisticsQuery(quantityType: steps, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
        let value = stats?.sumQuantity()?.doubleValue(for: HKUnit.count())
        promise.resolve(value)
      }
      self.store.execute(query)
      #else
      promise.resolve(nil)
      let _ = dayIso
      #endif
    }
  }

  #if os(iOS)
  private static func date(_ iso: String) -> Date? {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
  }

  private static func day(_ iso: String) -> Date? {
    let parts = iso.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 3 else { return nil }
    var c = DateComponents()
    c.year = parts[0]
    c.month = parts[1]
    c.day = parts[2]
    c.hour = 0
    return Calendar.current.date(from: c)
  }
  #endif
}
