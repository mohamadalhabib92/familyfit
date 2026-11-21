import { requireOptionalNativeModule } from 'expo-modules-core';

type NativeSession = {
  clockMs(): number;
  startClock(): number;
  pauseClock(): number;
  resumeClock(): number;
  seekClock(ms: number): number;
  speak(text: string, voiceId: string, locale: string): void;
  stopSpeech(): void;
};

const native = requireOptionalNativeModule<NativeSession>('FamilyfitSession');

export function sessionNativeAvailable(): boolean {
  return native != null;
}

export function readClockMs(): number | null {
  if (!native) return null;
  try {
    return native.clockMs();
  } catch {
    return null;
  }
}

export function startNativeClock(): number | null {
  if (!native) return null;
  try {
    return native.startClock();
  } catch {
    return null;
  }
}

export function pauseNativeClock(): number | null {
  if (!native) return null;
  try {
    return native.pauseClock();
  } catch {
    return null;
  }
}

export function resumeNativeClock(): number | null {
  if (!native) return null;
  try {
    return native.resumeClock();
  } catch {
    return null;
  }
}

export function seekNativeClock(ms: number): number | null {
  if (!native) return null;
  try {
    return native.seekClock(ms);
  } catch {
    return null;
  }
}

/** Moussa est plus grave. Élias, 6 ans, est plus haut et un peu plus lent. La musique des autres apps baisse pendant la phrase. */
export function speakCue(text: string, voiceId: 'moussa' | 'elias', locale: 'fr' | 'en'): void {
  if (!native || !text.trim()) return;
  try {
    native.speak(text, voiceId, locale);
  } catch {
    // Le texte reste à l’écran.
  }
}

export function stopCue(): void {
  if (!native) return;
  try {
    native.stopSpeech();
  } catch {
    // rien
  }
}
