/**
 * Focus téléviseur : le crayon posé doit se lire à trois mètres.
 * Le verre reste hors focus. Ces jetons ne changent pas le thème téléphone.
 */

export const TV_FOCUS_CREAM = '#F4EBD9';
export const TV_FOCUS_INK = '#0E2A22';
export const TV_FOCUS_COPPER = '#C8875A';
export const TV_FOCUS_BORDER = 3;
export const TV_FOCUS_SCALE = 1.05;

export function tvFocusScale(focused: boolean, reduceMotion: boolean): number {
  if (!focused || reduceMotion) return 1;
  return TV_FOCUS_SCALE;
}

export function tvFocusBorderWidth(focused: boolean): number {
  return focused ? TV_FOCUS_BORDER : 2;
}

/** Une rangée sans élément ne doit pas poser de contrôle de hauteur nulle dans le guide tvOS. */
export function shouldMountFocusRail(count: number): boolean {
  return Number.isFinite(count) && count > 0;
}

export function focusRail<T>(items: readonly (T | null | undefined)[] | null | undefined): T[] {
  const kept = (items ?? []).filter((item): item is T => item != null);
  return shouldMountFocusRail(kept.length) ? kept : [];
}
