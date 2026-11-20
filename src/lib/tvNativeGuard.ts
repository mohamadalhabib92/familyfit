/** Modules retirés du lien tvOS. Les charger au démarrage fait tomber le binaire. */
export const TV_EXCLUDED_MODULES = ['expo-speech', 'expo-haptics', 'expo-notifications'] as const;

export function shouldRequireNative(moduleName: string, isTV: boolean): boolean {
  if (!isTV) return true;
  return !(TV_EXCLUDED_MODULES as readonly string[]).includes(moduleName);
}
