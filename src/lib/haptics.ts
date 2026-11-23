/**
 * Retour léger sur le téléphone, jamais sur le salon (expo-haptics n’est pas lié sur tvOS).
 * « Réduire les animations » coupe aussi le retour, comme les boutons du kit.
 */

export function shouldPulse(enabled: boolean, tv: boolean, reduceMotion: boolean): boolean {
  return enabled && !tv && !reduceMotion;
}

export function pulseLight(): void {
  try {
    const Haptics = require('expo-haptics') as {
      impactAsync: (style: unknown) => Promise<void>;
      ImpactFeedbackStyle: { Light: unknown };
    };
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  } catch {
    // Web ou module absent : le minuteur continue.
  }
}
