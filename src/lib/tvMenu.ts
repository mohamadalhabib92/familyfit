export type TvSurface = 'profiles' | 'session';
export type TvMenuDecision = 'exit-home' | 'back-to-profiles';

/** À la liste des profils, Menu quitte vers l’accueil Apple TV. Dans une séance, il revient aux profils. */
export function tvMenuAction(surface: TvSurface): TvMenuDecision {
  return surface === 'session' ? 'back-to-profiles' : 'exit-home';
}

export type TvMenuControl = {
  enableTVMenuKey?: () => void;
  disableTVMenuKey?: () => void;
};

/**
 * react-native-tvos 0.87.1 : `enableTVMenuKey` pose le geste Menu, que
 * BackHandler reçoit. `disableTVMenuKey` retire ce geste : Menu sort de
 * l’app vers l’accueil tvOS, comme le demande le HIG à la racine.
 * Sur iPhone le module n’existe pas : on ne l’appelle pas.
 */
export function applyTvMenuPolicy(surface: TvSurface, control: TvMenuControl | null | undefined): TvMenuDecision {
  const action = tvMenuAction(surface);
  if (!control) return action;
  if (action === 'back-to-profiles') control.enableTVMenuKey?.();
  else control.disableTVMenuKey?.();
  return action;
}

export function readTvMenuControl(host: { TVEventControl?: TvMenuControl } | null | undefined): TvMenuControl | null {
  const control = host?.TVEventControl;
  if (!control || typeof control.enableTVMenuKey !== 'function' || typeof control.disableTVMenuKey !== 'function') return null;
  return control;
}
