import * as Speech from 'expo-speech';
import type { Coach } from './coaches';
import type { Locale } from './workoutEngine';

const LANG: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US', de: 'de-DE', ar: 'ar' };

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
      try {
        Speech.stop();
        Speech.speak(line, { language: LANG[locale], pitch: coach.pitch, rate: coach.rate, volume: 1 });
      } catch {
        // Le texte reste à l’écran si la voix manque (web, silencieux, module absent).
      }
    },
    stop() {
      try { void Speech.stop(); } catch { /* rien à couper */ }
    },
  };
}

export function silentSpeaker(): Speaker {
  return { speak() { /* tests et préférence muette */ }, stop() { /* */ } };
}
