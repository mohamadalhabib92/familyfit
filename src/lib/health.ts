/**
 * Garde-fous bien-être. Aucune allégation médicale : les phrases sont des
 * mentions de prudence, marquées « à valider », pas des contenus validés.
 */

export const HEALTH_DISCLAIMER =
  'FamilyFit ne pose aucun diagnostic et ne donne aucun conseil médical. Les activités sont déclaratives et ne servent jamais à la publicité. En cas de question de santé, consultez un professionnel. À valider.';

const SENSITIVE = /\b(poids|imc|kcal|calories?|kilocalories?|kilos?|kilogrammes?|masse corporelle)\b|\bkg\b/i;

/** Refuse un objectif qui suivrait le poids, l’IMC ou les calories (enfants compris). */
export function sensitiveHealthIssue(title: string, unit: string): string | null {
  if (!SENSITIVE.test(`${title} ${unit}`)) return null;
  return 'FamilyFit ne suit pas le poids, l’IMC ni les calories, en particulier pour les enfants. Ce n’est pas un outil médical (à valider). Consultez un professionnel de santé.';
}

const MOVEMENT = /bouger|étire|marche|respiration|danse/i;

export function movementNote(title: string, items: string[]): string | null {
  if (!MOVEMENT.test(`${title} ${items.join(' ')}`)) return null;
  return 'Activité douce, sans promesse de résultat. Arrêtez en cas de douleur. Consultez un professionnel de santé. À valider.';
}
