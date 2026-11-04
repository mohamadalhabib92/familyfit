export type Scheme = 'light' | 'dark';

/**
 * Design system FamilyFit — seule source des couleurs (clair, puis sombre plus bas).
 * L'accent #D08C60 ne passe pas le AA en texte sur fond clair (≈ 2,5:1) :
 * le réserver aux pastilles et icônes. Le texte utilise accentText (≈ 5,9:1).
 * Les ratios sont vérifiés par scripts/test-foundations.mjs.
 */
export const theme = {
  bg: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEAE3',
  text: '#1D2522',
  /** Assombri pour AA sur #F6F4EF (l'ancien #6E7671 était à 4,25:1). */
  muted: '#55605A',
  primary: '#2F4B43',
  onPrimary: '#FFFFFF',
  /** Pastilles et icônes uniquement. Pas de texte fin. */
  accent: '#D08C60',
  /** Variante texte de l'accent, AA sur le fond. */
  accentText: '#8B4E2F',
  /** Encre sur une pastille accent (le blanc échoue). */
  onAccent: '#1D2522',
  border: '#E3E0D8',
  danger: '#B3261E',
  dangerBg: '#FBEAE8',
  onDanger: '#FFFFFF',
  /** Assombri : l'ancien #2E7D4F était à 4,41:1 sur successBg. */
  success: '#276B44',
  successBg: '#E5F3EA',
  warning: '#8A5A00',
  warningBg: '#FCF1D9',
  info: '#2F5F8A',
  infoBg: '#E7EFF7',
  shadow: '#1D2522',
  radius: 16,
  displayFont: undefined as string | undefined,
  category: {
    family: '#2F4B43',
    work: '#2F5F8A',
    school: '#8A5A00',
    leisure: '#B0476B',
    wellness: '#2E7D4F',
  },
  /**
   * 8 couleurs de membres, distinctes. Le motif (glyph) accompagne toujours la couleur.
   * #D08C60 reste dans la palette : le texte sur cette pastille utilise onAccent, pas le blanc.
   */
  memberPalette: [
    { color: '#2F4B43', glyph: 'ellipse', label: 'Rond' },
    { color: '#D08C60', glyph: 'square', label: 'Carré' },
    { color: '#2F5F8A', glyph: 'triangle', label: 'Triangle' },
    { color: '#B0476B', glyph: 'heart', label: 'Cœur' },
    { color: '#6B5BA8', glyph: 'star', label: 'Étoile' },
    { color: '#2E7D4F', glyph: 'leaf', label: 'Feuille' },
    { color: '#8A5A00', glyph: 'bookmark', label: 'Signet' },
    { color: '#15616D', glyph: 'water', label: 'Goutte' },
  ] as const,
};

export type Theme = typeof theme;

/**
 * Sombre « soirée en famille » : vert sapin profond, encre crème, sauge et terracotta adoucis.
 * Catégories et couleurs de membres restent identiques (repères stables, encre via inkOn).
 * Ratios AA vérifiés par scripts/test-dark.mjs.
 */
const DARK = {
  bg: '#111614', surface: '#181F1C', surfaceAlt: '#222B27', text: '#ECEBE6', muted: '#A7B0AB',
  primary: '#8EC3B0', onPrimary: '#0E1F19', accent: '#D99A70', accentText: '#E7AE87', onAccent: '#1D2522',
  border: '#2B3430', danger: '#F2897E', dangerBg: '#3A1D19', onDanger: '#2B0D0A',
  success: '#7DD3A0', successBg: '#14291D', warning: '#E9C46A', warningBg: '#2E2512',
  info: '#8DB9E6', infoBg: '#13243A', shadow: '#000000',
};
/** Catégories éclaircies en sombre (barres, icônes) ; mêmes teintes reconnaissables. */
const DARK_CATEGORY = { family: '#8EC3B0', work: '#8DB9E6', school: '#E9C46A', leisure: '#E59AB5', wellness: '#7DD3A0' };
const LIGHT_CATEGORY = { ...theme.category };
const LIGHT = Object.fromEntries(Object.keys(DARK).map((k) => [k, theme[k as keyof typeof DARK]])) as typeof DARK;

let current: Scheme = 'light';
export const currentScheme = () => current;
/** Réécrit les couleurs en place ; la racine remonte la navigation (clé = schéma). */
export function applyScheme(s: Scheme) {
  if (s === current) return;
  current = s;
  Object.assign(theme, s === 'dark' ? DARK : LIGHT);
  Object.assign(theme.category, s === 'dark' ? DARK_CATEGORY : LIGHT_CATEGORY);
}

/** Espacements — grille de 8 (4 pour les micro-ajustements). */
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
