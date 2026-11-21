import { Platform } from 'react-native';
import type { Coach } from './coaches';
import type { Locale } from './workoutEngine';
import { shouldRequireNative } from './tvNativeGuard';

const LANG: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US', de: 'de-DE', ar: 'ar' };

type SpeechApi = {
  speak(text: string, options?: { language?: string; pitch?: number; rate?: number; volume?: number }): void;
  stop(): void | Promise<void>;
};

/** expo-speech n’est pas lié sur tvOS. On ne le charge que si le binaire l’a. */
function speechApi(): SpeechApi | null {
  if (!shouldRequireNative('expo-speech', (Platform as { isTV?: boolean }).isTV === true)) return null;
  try {
    return require('expo-speech') as SpeechApi;
  } catch {
    return null;
  }
}

export interface Speaker {
  speak(text: string, coach: Coach, locale: Locale): void;
  stop(): void;
}

/** Voix du système, sur l’appareil. Aucun service de synthèse payant. */
export function deviceSpeaker(): Speaker {
  return {
    speak(text, coach, locale) {
      const line = text.trim();
      if (!line) return;
      const speech = speechApi();
      if (!speech) return;
      try {
        void speech.stop();
        speech.speak(line, { language: LANG[locale], pitch: coach.pitch, rate: coach.rate, volume: 1 });
      } catch {
        // Le texte reste à l’écran si la voix manque (web, silencieux, module absent).
      }
    },
    stop() {
      const speech = speechApi();
      if (!speech) return;
      try { void speech.stop(); } catch { /* rien à couper */ }
    },
  };
}

export function silentSpeaker(): Speaker {
  return { speak() { /* tests et préférence muette */ }, stop() { /* */ } };
}
