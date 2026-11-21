package expo.modules.familyfithealth

import android.content.Intent
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.concurrent.thread
import kotlinx.coroutines.runBlocking

class FamilyfitHealthModule : Module() {
  private var pending: Promise? = null

  private val permissions = setOf(
    HealthPermission.getReadPermission(StepsRecord::class),
    HealthPermission.getWritePermission(ExerciseSessionRecord::class),
  )

  override fun definition() = ModuleDefinition {
    Name("FamilyfitHealth")

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST) return@OnActivityResult
      val promise = pending ?: return@OnActivityResult
      pending = null
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve("denied")
        return@OnActivityResult
      }
      thread {
        promise.resolve(if (hasPermissions(activity.applicationContext)) "granted" else "denied")
      }
    }

    AsyncFunction("requestPermissions") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve("unavailable")
        return@AsyncFunction
      }
      val context = activity.applicationContext
      if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
        promise.resolve("unavailable")
        return@AsyncFunction
      }
      thread {
        if (hasPermissions(context)) {
          promise.resolve("granted")
          return@thread
        }
        activity.runOnUiThread {
          pending = promise
          val intent: Intent = PermissionController.createRequestPermissionResultContract().createIntent(activity, permissions)
          activity.startActivityForResult(intent, REQUEST)
        }
      }
    }

    AsyncFunction("writeWorkout") { startIso: String, endIso: String, title: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null || HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
        promise.resolve("unavailable")
        return@AsyncFunction
      }
      thread {
        try {
          if (!hasPermissions(context)) {
            promise.resolve("denied")
            return@thread
          }
          val start = Instant.parse(startIso)
          val end = Instant.parse(endIso)
          val zone = ZoneId.systemDefault()
          val record = ExerciseSessionRecord(
            startTime = start,
            startZoneOffset = zone.rules.getOffset(start),
            endTime = end,
            endZoneOffset = zone.rules.getOffset(end),
            exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
            title = title,
            notes = null,
          )
          runBlocking { HealthConnectClient.getOrCreate(context).insertRecords(listOf(record)) }
          promise.resolve("written")
        } catch (_: Exception) {
          promise.resolve("failed")
        }
      }
    }

    AsyncFunction("readSteps") { dayIso: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null || HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
        promise.resolve(null)
        return@AsyncFunction
      }
      thread {
        try {
          if (!hasPermissions(context)) {
            promise.resolve(null)
            return@thread
          }
          val zone = ZoneId.systemDefault()
          val day = LocalDate.parse(dayIso)
          val start = day.atStartOfDay(zone).toInstant()
          val end = day.plusDays(1).atStartOfDay(zone).toInstant()
          val response = runBlocking {
            HealthConnectClient.getOrCreate(context).readRecords(
              ReadRecordsRequest(StepsRecord::class, timeRangeFilter = TimeRangeFilter.between(start, end)),
            )
          }
          promise.resolve(response.records.sumOf { it.count })
        } catch (_: Exception) {
          promise.resolve(null)
        }
      }
    }
  }

  private fun hasPermissions(context: android.content.Context): Boolean {
    return try {
      val granted = runBlocking { HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions() }
      granted.containsAll(permissions)
    } catch (_: Exception) {
      false
    }
  }

  companion object {
    private const val REQUEST = 48151
  }
}
