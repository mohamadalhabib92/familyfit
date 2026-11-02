/**
 * Décision de route une fois le stockage lu.
 * Sans session, on va à la connexion. Jamais à l'onboarding :
 * sinon « Terminer » renvoie vers /, qui renvoie vers l'onboarding,
 * et la famille déjà enregistrée devient inaccessible.
 * signOut ne doit pas effacer family.
 */
export type GateInput = {
  supabaseConfigured: boolean;
  hasSession: boolean;
  hasFamily: boolean;
  onboarded: boolean;
  trialDeclined: boolean;
};

export type GateDest = 'trial' | 'auth' | 'onboarding' | 'app';

export function routeAfterReady(input: GateInput): GateDest {
  if (!input.hasSession && !input.supabaseConfigured && !input.hasFamily && !input.trialDeclined) return 'trial';
  if (!input.hasSession) return 'auth';
  if (!input.hasFamily || !input.onboarded) return 'onboarding';
  return 'app';
}

export type LocalState = {
  supabaseConfigured: boolean;
  session: { userId: string } | null;
  family: { id: string } | null;
  onboarded: boolean;
  trialDeclined: boolean;
};

function toGate(state: LocalState): GateInput {
  return {
    supabaseConfigured: state.supabaseConfigured,
    hasSession: !!state.session,
    hasFamily: !!state.family,
    onboarded: state.onboarded,
    trialDeclined: state.trialDeclined,
  };
}

/** La session tombe. La famille reste le même objet. */
export function signOut(state: LocalState): LocalState {
  return { ...state, session: null };
}

/** Bouton Terminer de l'onboarding : prefs mises à jour, puis la route. */
export function finishOnboarding(state: LocalState): { state: LocalState; href: '/' | '/auth' } {
  const next: LocalState = { ...state, onboarded: true, trialDeclined: true };
  return { state: next, href: next.session ? '/' : '/auth' };
}

/** /onboarding?replace=1 sans session et sans Supabase renvoie à la connexion. */
export function onboardingReplaceTarget(state: { supabaseConfigured: boolean; session: unknown }, replace: boolean): '/auth' | null {
  if (!state.session && !state.supabaseConfigured && replace) return '/auth';
  return null;
}

export function runGateSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const family = { id: 'fam_kept' };
  let state: LocalState = {
    supabaseConfigured: false,
    session: { userId: 'u1' },
    family,
    onboarded: true,
    trialDeclined: false,
  };
  check('avant déconnexion, l’app est ouverte', routeAfterReady(toGate(state)) === 'app');
  state = signOut(state);
  check('la déconnexion garde la même famille', state.session === null && state.family === family);
  check('après déconnexion, l’écran est la connexion', routeAfterReady(toGate(state)) === 'auth');
  check(
    'onboarding?replace=1 sans session locale va vers /auth',
    onboardingReplaceTarget(state, true) === '/auth',
  );
  const done = finishOnboarding(state);
  check('terminer sans session va vers /auth', done.href === '/auth');
  check(
    'après terminer, on reste sur la connexion et la famille est là',
    routeAfterReady(toGate(done.state)) === 'auth' && done.state.family === family,
  );

  check(
    'première ouverture locale sans famille : essai, pas une boucle',
    routeAfterReady({ supabaseConfigured: false, hasSession: false, hasFamily: false, onboarded: false, trialDeclined: false }) === 'trial',
  );
  check(
    'clés présentes et pas de session : /auth',
    routeAfterReady({ supabaseConfigured: true, hasSession: false, hasFamily: false, onboarded: false, trialDeclined: false }) === 'auth',
  );
  check(
    'session sans famille : onboarding',
    routeAfterReady({ supabaseConfigured: false, hasSession: true, hasFamily: false, onboarded: false, trialDeclined: true }) === 'onboarding',
  );
  check(
    'session et famille prêtes : app',
    routeAfterReady({ supabaseConfigured: false, hasSession: true, hasFamily: true, onboarded: true, trialDeclined: true }) === 'app',
  );
  return out;
}
