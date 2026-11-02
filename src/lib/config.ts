/**
 * Lecture des variables d'environnement publiques Expo.
 * Toute valeur absente ou commençant par « YOUR_ » est considérée comme
 * non configurée : l'app reste alors en mode local / démo, sans crash.
 */
export function env(name: string, value: string | undefined): { name: string; value: string | null; configured: boolean } {
  const v = (value ?? '').trim();
  const configured = v.length > 0 && !v.startsWith('YOUR_');
  return { name, value: configured ? v : null, configured };
}

function readFlag(name: string): boolean {
  const raw = (process.env[name] ?? process.env[`EXPO_PUBLIC_${name}`] ?? '').trim().toLowerCase();
  return raw === 'true' || raw === '1';
}

/** Santé et calendriers externes : inactifs tant que Mohamed ne les active pas. */
export const featureHealth = readFlag('FEATURE_HEALTH');
export const featureExternalCalSync = readFlag('FEATURE_EXTERNAL_CAL_SYNC');

/** Défaut spec : 16. YOUR_* ou vide ne change pas ce défaut. */
export function teenMinAge(): number {
  const raw = (process.env.EXPO_PUBLIC_TEEN_MIN_AGE ?? process.env.YOUR_TEEN_MIN_AGE ?? '').trim();
  if (!raw || raw.startsWith('YOUR_')) return 16;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 13 && n <= 18 ? n : 16;
}

/** Null si absent ou placeholder : on n’affiche pas une adresse inventée. */
export function supportEmail(): string | null {
  return env('EXPO_PUBLIC_SUPPORT_EMAIL', process.env.EXPO_PUBLIC_SUPPORT_EMAIL).value;
}
