/**
 * Audit bien-être — Passe 1.
 * FamilyFit ne diagnostique pas et ne promet aucun résultat.
 * Phrase imposée par le spec sur les contenus d'activité.
 * Les objectifs « poids », « IMC » et « calories » sont refusés à l'enregistrement
 * (aucun suivi de ce type n'existe dans les données livrées).
 * Ceci n'est pas un texte médical validé.
 */
export const HEALTH_DISCLAIMER =
  'Activité légère, sans diagnostic ni promesse de résultat. Consultez un professionnel de santé.';

const BANNED = /poids|imc|\bkcal\b|calorie|maigrir|régime/i;

export function healthGoalError(title: string, unit: string): string | null {
  if (BANNED.test(title) || BANNED.test(unit)) {
    return 'FamilyFit ne suit pas le poids, l’IMC ni les calories, en particulier pour les enfants. Choisissez un repère d’activité (minutes, sorties, verres d’eau).';
  }
  return null;
}
