/**
 * Design system FamilyFit — seule source des couleurs.
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
  ],
} as const;

export type Theme = typeof theme;
