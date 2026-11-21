import ExpoModulesCore
import AVFoundation
import QuartzCore

/// Voix et horloge. Pas de Photos, pas de HealthKit : le fichier reste compilable sur tvOS.
final class SessionSpeaker: NSObject, AVSpeechSynthesizerDelegate {
  let synth = AVSpeechSynthesizer()

  func speak(text: String, voiceId: String, locale: String) {
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers, .mixWithOthers])
    try? session.setActive(true, options: [])
    let utterance = AVSpeechUtterance(string: text)
    utterance.voice = AVSpeechSynthesisVoice(language: locale == "en" ? "en-US" : "fr-FR")
    if voiceId == "elias" {
      utterance.pitchMultiplier = 1.45
      utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.9
    } else {
      utterance.pitchMultiplier = 0.86
      utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.96
    }
    synth.delegate = self
    synth.speak(utterance)
  }

  func stop() {
    synth.stopSpeaking(at: .immediate)
    try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
  }

  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
    if synthesizer.isSpeaking { return }
    try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
  }
}

public class FamilyfitSessionModule: Module {
  private let speaker = SessionSpeaker()
  private var origin: CFTimeInterval = 0
  private var elapsed: CFTimeInterval = 0
  private var running = false

  private func mediaMs() -> Double {
    let seconds = running ? (CACurrentMediaTime() - origin) : elapsed
    return seconds * 1000
  }

  public func definition() -> ModuleDefinition {
    Name("FamilyfitSession")

    Function("clockMs") { () -> Double in
      self.mediaMs()
    }

    Function("startClock") { () -> Double in
      if !self.running {
        self.origin = CACurrentMediaTime() - self.elapsed
        self.running = true
      }
      return self.mediaMs()
    }

    Function("pauseClock") { () -> Double in
      if self.running {
        self.elapsed = CACurrentMediaTime() - self.origin
        self.running = false
      }
      return self.elapsed * 1000
    }

    Function("resumeClock") { () -> Double in
      if !self.running {
        self.origin = CACurrentMediaTime() - self.elapsed
        self.running = true
      }
      return self.mediaMs()
    }

    Function("seekClock") { (ms: Double) -> Double in
      self.elapsed = max(0, ms) / 1000
      if self.running {
        self.origin = CACurrentMediaTime() - self.elapsed
      }
      return self.elapsed * 1000
    }

    Function("speak") { (text: String, voiceId: String, locale: String) in
      self.speaker.speak(text: text, voiceId: voiceId, locale: locale)
    }

    Function("stopSpeech") {
      self.speaker.stop()
    }
  }
}
