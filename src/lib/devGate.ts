/**
 * L'écran diagnostic n'est pas un écran produit.
 * Ouvert en développement, ou après 7 appuis en moins de 4 secondes
 * sur le nom de la famille (onglet Famille) ou le titre de connexion.
 * Documenté dans le README. Aucun secret n'est affiché.
 */
let unlocked = false;
const taps: number[] = [];

export function configAccessAllowed(): boolean {
  return (typeof __DEV__ !== 'undefined' && __DEV__) || unlocked;
}

/** @returns true quand le geste vient d'ouvrir l'accès. */
export function registerSecretTap(): boolean {
  const now = Date.now();
  taps.push(now);
  while (taps.length && now - taps[0] > 4000) taps.shift();
  if (taps.length >= 7) {
    taps.length = 0;
    unlocked = true;
    return true;
  }
  return false;
}
