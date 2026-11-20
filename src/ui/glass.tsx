import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { useVisualEffects } from './effects';
import { currentFinish, isDark, isGlass } from './ThemeProvider';

/**
 * Voile opaque (alpha 0,90) : le texte ne repose pas sur le flou.
 * « Réduire la transparence » : pas de flou, le parent garde un fond plein.
 */
export function GlassLayers({ children, style, radius = 20 }: { children: ReactNode; style?: StyleProp<ViewStyle>; radius?: number }) {
  const fx = useVisualEffects();
  const dark = isDark();
  const gold = currentFinish() === 'verre-or';
  const wash = glassVeil();
  const border = gold ? 'rgba(208,140,96,0.75)' : dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)';
  const webBlur = Platform.OS === 'web' && fx.blur ? ({ backdropFilter: `blur(${fx.intensity / 3}px)`, WebkitBackdropFilter: `blur(${fx.intensity / 3}px)` } as ViewStyle) : null;
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: border }, style]}>
      {fx.blur ? <BlurView intensity={fx.intensity} tint={dark ? 'dark' : 'light'} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} /> : null}
      <View style={[{ backgroundColor: wash }, webBlur]}>{children}</View>
    </View>
  );
}

export function useGlassLook(): boolean {
  const fx = useVisualEffects();
  return isGlass() && fx.blur;
}

/**
 * Bouton posé : arête claire, deux ombres (contact + halo), enfoncement au press.
 * `motion` faux (« Réduire les animations ») : pas de translation ni de scale.
 */
export function raisedShadow(pressed: boolean, motion: boolean): ViewStyle {
  const down = pressed && motion;
  const dark = isDark();
  const contact = dark ? 'rgba(0,0,0,0.55)' : 'rgba(29,37,34,0.22)';
  const halo = dark ? 'rgba(0,0,0,0.42)' : 'rgba(47,75,67,0.16)';
  return {
    borderTopWidth: 1,
    borderTopColor: dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.72)',
    borderBottomWidth: down ? 1 : 3,
    borderBottomColor: dark ? 'rgba(0,0,0,0.55)' : 'rgba(47,75,67,0.28)',
    shadowColor: dark ? '#000000' : '#1D2522',
    shadowOpacity: down ? 0.12 : dark ? 0.45 : 0.22,
    shadowRadius: down ? 3 : 12,
    shadowOffset: { width: 0, height: down ? 1 : 6 },
    elevation: down ? 1 : 8,
    boxShadow: down
      ? `0 1px 1px ${contact}, 0 1px 2px ${halo}`
      : `0 2px 3px ${contact}, 0 8px 16px ${halo}`,
    transform: down ? [{ translateY: 2 }, { scale: 0.98 }] : undefined,
  };
}

/** Voile 0.90 : le texte repose sur la teinte du thème, le flou est derrière. */
export function glassVeil(): string {
  return isDark() ? 'rgba(16,22,20,0.90)' : 'rgba(246,244,239,0.90)';
}

export function glassWash(): string {
  return currentFinish() === 'verre-or' ? 'rgba(208,140,96,0.28)' : 'rgba(47,75,67,0.16)';
}
