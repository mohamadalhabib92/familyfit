/**
 * Design system FamilyFit — seule source des couleurs.
 * L'accent #D08C60 est réservé aux pastilles et icônes.
 * Le texte utilise accentText (assombri) : le contraste AA est vérifié par runThemeSelfTests().
 */

export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport WCAG. */
export function contrast(a: string, b: string): number {
  const L1 = luminance(a);
  const L2 = luminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export const theme = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEAE3',
  text: '#1D2522',
  muted: '#4E5853',
  primary: '#2F4B43',
  onPrimary: '#FFFFFF',
  accent: '#D08C60',
  /** Variante texte de l'accent. Ne pas écrire en #D08C60 sur fond clair. */
  accentText: '#7A4524',
  border: '#E3E0D8',
  danger: '#9F221C',
  onDanger: '#FFFFFF',
  dangerBg: '#FBEAE8',
  success: '#1F6B45',
  onSuccess: '#FFFFFF',
  successBg: '#E5F3EA',
  warning: '#7A4E00',
  onWarning: '#FFFFFF',
  warningBg: '#FCF1D9',
  info: '#2F5F8A',
  onInfo: '#FFFFFF',
  infoBg: '#E7EFF7',
  shadow: '#1D2522',
  radius: 16,
  displayFont: undefined as string | undefined,
  hit: 44,
  /** Plafond Dynamic Type : 200 %. */
  maxFontScale: 2,
  largeTextScale: 1.3,
};

/** Encre lisible (AA) sur un fond donné. Blanc seulement s'il passe 4,5:1. */
export function inkOn(bg: string): string {
  return contrast(theme.onPrimary, bg) >= 4.5 ? theme.onPrimary : theme.text;
}

export type MemberPattern = 'plein' | 'anneau' | 'points' | 'bandes';

/** 8 couleurs de membres, chacune avec une icône (l'info ne repose pas sur la couleur seule). */
export const memberPalette: {
  color: string;
  onColor: string;
  icon: string;
  label: string;
  pattern: MemberPattern;
}[] = [
  { color: '#2F4B43', onColor: '#FFFFFF', icon: 'person-outline', label: 'Sauge', pattern: 'plein' },
  { color: '#D08C60', onColor: '#1D2522', icon: 'heart-outline', label: 'Terre cuite', pattern: 'anneau' },
  { color: '#2F5F8A', onColor: '#FFFFFF', icon: 'star-outline', label: 'Mer', pattern: 'points' },
  { color: '#B0476B', onColor: '#FFFFFF', icon: 'flower-outline', label: 'Rose', pattern: 'bandes' },
  { color: '#6B5BA8', onColor: '#FFFFFF', icon: 'moon-outline', label: 'Violet', pattern: 'plein' },
  { color: '#1F6B45', onColor: '#FFFFFF', icon: 'leaf-outline', label: 'Forêt', pattern: 'anneau' },
  { color: '#7A4E00', onColor: '#FFFFFF', icon: 'sunny-outline', label: 'Ambre', pattern: 'points' },
  { color: '#1F6A62', onColor: '#FFFFFF', icon: 'water-outline', label: 'Lagon', pattern: 'bandes' },
];

export const categoryPalette = {
  family: { color: '#2F4B43', icon: 'home-outline' },
  work: { color: '#2F5F8A', icon: 'briefcase-outline' },
  school: { color: '#7A4E00', icon: 'school-outline' },
  leisure: { color: '#B0476B', icon: 'game-controller-outline' },
  wellness: { color: '#1F6B45', icon: 'leaf-outline' },
} as const;

/** Anciennes teintes déjà enregistrées sur l'appareil : on garde la couleur stockée, on lui associe une icône. */
const legacyMemberIcons: Record<string, (typeof memberPalette)[number]> = {
  '#2e7d4f': memberPalette[5],
  '#8a5a00': memberPalette[6],
};

export function memberVisual(color: string) {
  const key = color.toLowerCase();
  const found = memberPalette.find((m) => m.color.toLowerCase() === key) ?? legacyMemberIcons[key];
  if (found) return { ...found, color };
  return { ...memberPalette[0], color, onColor: inkOn(color), label: 'Membre' };
}

export type Theme = typeof theme;

export function runThemeSelfTests(): { name: string; ok: boolean; detail?: string }[] {
  const pair = (name: string, fg: string, bg: string, min = 4.5) => {
    const ratio = contrast(fg, bg);
    return { name: `${name} ${ratio.toFixed(2)}:1`, ok: ratio >= min, detail: `${fg} sur ${bg}` };
  };
  const out: { name: string; ok: boolean; detail?: string }[] = [
    pair('texte / fond', theme.text, theme.bg),
    pair('texte / surface', theme.text, theme.surface),
    pair('muted / fond', theme.muted, theme.bg),
    pair('muted / surface', theme.muted, theme.surface),
    pair('accentText / fond', theme.accentText, theme.bg),
    pair('accentText / surface', theme.accentText, theme.surface),
    pair('onPrimary / primary', theme.onPrimary, theme.primary),
    pair('texte / accent (pastille)', theme.text, theme.accent),
    pair('danger / fond', theme.danger, theme.bg),
    pair('onDanger / danger', theme.onDanger, theme.danger),
    pair('success / fond', theme.success, theme.bg),
    pair('warning / fond', theme.warning, theme.bg),
    pair('info / fond', theme.info, theme.bg),
    pair('danger / dangerBg', theme.danger, theme.dangerBg),
    pair('success / successBg', theme.success, theme.successBg),
    pair('warning / warningBg', theme.warning, theme.warningBg),
    pair('info / infoBg', theme.info, theme.infoBg),
  ];
  const accentRatio = contrast(theme.accent, theme.bg);
  out.push({
    name: `accent brut illisible en texte ${accentRatio.toFixed(2)}:1`,
    ok: accentRatio < 4.5,
    detail: 'Le #D08C60 ne doit pas servir de texte sur fond clair',
  });
  const colors = new Set(memberPalette.map((m) => m.color.toLowerCase()));
  out.push({ name: '8 couleurs de membres distinctes', ok: memberPalette.length === 8 && colors.size === 8 });
  for (const m of memberPalette) {
    const ratio = contrast(m.onColor, m.color);
    out.push({ name: `membre ${m.label} ${ratio.toFixed(2)}:1`, ok: ratio >= 4.5, detail: m.icon });
    out.push({ name: `encre ${m.label}`, ok: m.onColor.toLowerCase() === inkOn(m.color).toLowerCase() });
  }
  for (const [key, c] of Object.entries(categoryPalette)) {
    out.push(pair(`catégorie ${key}`, inkOn(c.color), c.color));
  }
  return out;
}
