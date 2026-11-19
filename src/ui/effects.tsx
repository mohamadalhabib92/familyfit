import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export type VisualEffects = {
  /** Faux si « Réduire la transparence » est actif. */
  blur: boolean;
  /** Faux si « Réduire les animations » est actif. */
  motion: boolean;
  /** Intensité expo-blur. Plus basse sur tvOS. 0 = pas de flou. */
  intensity: number;
  tv: boolean;
};

export function resolveEffects(reduceTransparency: boolean, reduceMotion: boolean, tv: boolean): VisualEffects {
  if (reduceTransparency) return { blur: false, motion: !reduceMotion, intensity: 0, tv };
  if (tv) return { blur: true, motion: !reduceMotion, intensity: 18, tv: true };
  return { blur: true, motion: !reduceMotion, intensity: 48, tv: false };
}

const FULL: VisualEffects = { blur: true, motion: true, intensity: 48, tv: false };
const Ctx = createContext<VisualEffects>(FULL);

export function useVisualEffects(): VisualEffects {
  return useContext(Ctx);
}

function webPref(query: string): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

export function VisualEffectsProvider({ children }: { children: ReactNode }) {
  const tv = Platform.isTV === true;
  const [fx, setFx] = useState<VisualEffects>(() => resolveEffects(webPref('(prefers-reduced-transparency: reduce)'), webPref('(prefers-reduced-motion: reduce)'), tv));
  useEffect(() => {
    let alive = true;
    let transparency = webPref('(prefers-reduced-transparency: reduce)');
    let motion = webPref('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (alive) setFx(resolveEffects(transparency, motion, tv));
    };
    apply();
    const ai = AccessibilityInfo as typeof AccessibilityInfo & { isReduceTransparencyEnabled?: () => Promise<boolean> };
    void ai.isReduceMotionEnabled?.().then((v) => { motion = v; apply(); }).catch(() => undefined);
    void ai.isReduceTransparencyEnabled?.().then((v) => { transparency = v || transparency; apply(); }).catch(() => undefined);
    const subs: { remove(): void }[] = [];
    try { subs.push(AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { motion = v; apply(); })); } catch { /* web */ }
    try { subs.push(AccessibilityInfo.addEventListener('reduceTransparencyChanged', (v) => { transparency = v; apply(); })); } catch { /* anciennes plateformes */ }
    let mqT: MediaQueryList | null = null;
    let mqM: MediaQueryList | null = null;
    const onT = () => { transparency = webPref('(prefers-reduced-transparency: reduce)'); apply(); };
    const onM = () => { motion = webPref('(prefers-reduced-motion: reduce)'); apply(); };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      mqT = window.matchMedia('(prefers-reduced-transparency: reduce)');
      mqM = window.matchMedia('(prefers-reduced-motion: reduce)');
      mqT.addEventListener?.('change', onT);
      mqM.addEventListener?.('change', onM);
    }
    return () => {
      alive = false;
      subs.forEach((s) => s.remove());
      mqT?.removeEventListener?.('change', onT);
      mqM?.removeEventListener?.('change', onM);
    };
  }, [tv]);
  return <Ctx.Provider value={fx}>{children}</Ctx.Provider>;
}
