/** Vrai seulement dans un build de développement. TestFlight et l’App Store restent fermés. */
export function showDevSurfaces(dev: boolean): boolean {
  return dev === true;
}

export function devBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}
