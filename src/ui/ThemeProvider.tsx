import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme } from './themeDark';
import { lightTheme, theme } from './theme';

export type ColorMode = 'light' | 'dark';
export type SchemePref = 'system' | ColorMode;

const ModeContext = createContext<{ mode: ColorMode; haptics: boolean }>({ mode: 'light', haptics: true });

/** Bascule les jetons lus par les écrans (`theme`) et publie le mode pour la barre d’état. */
export function ThemeProvider({ scheme = 'system', haptics = true, children }: { scheme?: SchemePref; haptics?: boolean; children: ReactNode }) {
  const system = useColorScheme();
  const mode: ColorMode = scheme === 'dark' || (scheme === 'system' && system === 'dark') ? 'dark' : 'light';
  const active = mode === 'dark' ? darkTheme : lightTheme;
  // Les écrans importent `theme` directement. On aligne l’objet vivant avant le rendu des enfants.
  if (theme.bg !== active.bg || theme.text !== active.text) Object.assign(theme, active);
  const value = useMemo(() => ({ mode, haptics }), [mode, haptics]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useColorMode(): ColorMode {
  return useContext(ModeContext).mode;
}

export function useHapticsEnabled(): boolean {
  return useContext(ModeContext).haptics;
}
