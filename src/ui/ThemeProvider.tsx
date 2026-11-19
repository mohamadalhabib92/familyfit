import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme } from './themeDark';
import { lightTheme, theme } from './theme';

export type ColorMode = 'light' | 'dark';
export type SchemePref = 'system' | ColorMode;
/** Classique reste. Verre est un verre clair. Verre or est le verre sombre doré. */
export type Finish = 'classic' | 'verre' | 'verre-or';

const ModeContext = createContext<{ mode: ColorMode; haptics: boolean; finish: Finish }>({ mode: 'light', haptics: true, finish: 'classic' });

let finishNow: Finish = 'classic';
let modeNow: ColorMode = 'light';

export const currentFinish = (): Finish => finishNow;
export const isDark = () => modeNow === 'dark';
export const isGlass = () => finishNow !== 'classic';

/** Bascule les jetons lus par les écrans (`theme`) et publie le mode pour la barre d’état. */
export function ThemeProvider({ scheme = 'system', finish = 'classic', haptics = true, children }: { scheme?: SchemePref; finish?: Finish; haptics?: boolean; children: ReactNode }) {
  const system = useColorScheme();
  const mode: ColorMode = finish === 'verre-or'
    ? 'dark'
    : finish === 'verre'
      ? 'light'
      : scheme === 'dark' || (scheme === 'system' && system === 'dark')
        ? 'dark'
        : 'light';
  const active = mode === 'dark' ? darkTheme : lightTheme;
  finishNow = finish;
  modeNow = mode;
  if (theme.bg !== active.bg || theme.text !== active.text) Object.assign(theme, active);
  const value = useMemo(() => ({ mode, haptics, finish }), [mode, haptics, finish]);
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useColorMode(): ColorMode {
  return useContext(ModeContext).mode;
}

export function useHapticsEnabled(): boolean {
  return useContext(ModeContext).haptics;
}
