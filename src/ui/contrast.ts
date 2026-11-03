/** Contraste WCAG 2.2. Aucune dépendance, testé par scripts/test-foundations.mjs. */

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio WCAG entre deux couleurs #RRGGBB. */
export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Texte lisible sur un fond. Blanc seulement s'il atteint AA (4,5:1), sinon encre foncée. */
export function inkOn(bg: string, dark = '#1D2522', light = '#FFFFFF'): string {
  return contrastRatio(bg, light) >= 4.5 ? light : dark;
}
