import { lightTheme } from './theme';

/**
 * Sombre, mêmes rôles que le thème clair. Les ratios AA sont vérifiés par le test fondations.
 * L’accent reste une pastille : le texte utilise accentText.
 */
export const darkTheme = {
  ...lightTheme,
  bg: '#101614',
  surface: '#1A2420',
  surfaceAlt: '#24302B',
  text: '#F3F6F4',
  muted: '#C5D0CB',
  primary: '#8FBFB0',
  onPrimary: '#10211C',
  accent: '#E0A37A',
  accentText: '#F0C2A4',
  onAccent: '#1D2522',
  border: '#31403A',
  danger: '#FFB4AB',
  dangerBg: '#3F1512',
  success: '#8FD6A8',
  successBg: '#143024',
  warning: '#F5D48A',
  warningBg: '#3A2C10',
  info: '#A9CFF2',
  infoBg: '#122433',
  shadow: '#000000',
} as const;
