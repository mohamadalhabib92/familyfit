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

/** Contrat de signOut : la session tombe, la famille reste. */
export function stateAfterSignOut<F>(state: { session: unknown; family: F }): { session: null; family: F } {
  return { session: null, family: state.family };
}

export function runGateSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const family = { id: 'fam_kept', name: 'Famille Martin' };
  const signedOut = stateAfterSignOut({ session: { mode: 'demo', userId: 'u1' }, family });
  check('la déconnexion garde la famille', signedOut.session === null && signedOut.family === family);

  const localSignedOut: GateInput = {
    supabaseConfigured: false,
    hasSession: false,
    hasFamily: true,
    onboarded: true,
    trialDeclined: false,
  };
  const first: string = routeAfterReady(localSignedOut);
  const afterFinish: string = routeAfterReady(localSignedOut);
  check('sans session locale, la route est /auth', first === 'auth');
  check('revenir à / après la déconnexion reste sur /auth', afterFinish === 'auth');
  check('la famille reste et la route n’est pas l’onboarding', localSignedOut.hasFamily === true && first === 'auth');

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
