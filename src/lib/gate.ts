/**
 * Décision de route une fois le stockage lu.
 * Les coachs et les séances sont dans l’app : on les ouvre sans compte,
 * même si les clés Supabase sont présentes, même hors ligne.
 * L’onboarding n’est demandé que pour une session déjà connectée
 * dont la famille n’est pas prête. Sans session, on n’y va jamais :
 * « Terminer » ne peut pas boucler.
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
  if (input.hasSession && (!input.hasFamily || !input.onboarded)) return 'onboarding';
  if (!input.hasSession && !input.hasFamily && !input.supabaseConfigured && !input.trialDeclined) return 'trial';
  return 'app';
}

export type LocalState = {
  supabaseConfigured: boolean;
  session: { userId: string } | null;
  family: { id: string } | null;
  onboarded: boolean;
  trialDeclined: boolean;
  trialMode?: boolean;
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

/** Bouton Terminer de l'onboarding : prefs mises à jour, puis l’accueil. Le compte reste facultatif. */
export function finishOnboarding(state: LocalState): { state: LocalState; href: '/' } {
  const next: LocalState = { ...state, onboarded: true, trialDeclined: true, trialMode: false };
  return { state: next, href: '/' };
}

/** Identifiant à poser sur un événement. Vide ou absent : on n’écrit pas. */
export function eventFamilyId(family: { id?: string | null } | null | undefined): string | null {
  const id = family?.id?.trim();
  return id ? id : null;
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
  check('après déconnexion, l’accueil reste ouvert hors ligne', routeAfterReady(toGate(state)) === 'app');
  check(
    'onboarding?replace=1 sans session locale va vers /auth',
    onboardingReplaceTarget(state, true) === '/auth',
  );
  const done = finishOnboarding(state);
  check('terminer sans session revient à l’accueil', done.href === '/');
  check(
    'après terminer, l’app s’ouvre et la famille est là',
    routeAfterReady(toGate(done.state)) === 'app' && done.state.family === family,
  );

  check(
    'première ouverture locale sans famille : essai, pas une boucle',
    routeAfterReady({ supabaseConfigured: false, hasSession: false, hasFamily: false, onboarded: false, trialDeclined: false }) === 'trial',
  );
  check(
    'clés présentes et pas de session : l’accueil, sans compte',
    routeAfterReady({ supabaseConfigured: true, hasSession: false, hasFamily: false, onboarded: false, trialDeclined: false }) === 'app',
  );
  check(
    'famille déjà là, sans session : pas de boucle d’onboarding',
    routeAfterReady({ supabaseConfigured: true, hasSession: false, hasFamily: true, onboarded: true, trialDeclined: true }) === 'app',
  );
  check(
    'session sans famille : onboarding',
    routeAfterReady({ supabaseConfigured: false, hasSession: true, hasFamily: false, onboarded: false, trialDeclined: true }) === 'onboarding',
  );
  check(
    'session et famille prêtes : app',
    routeAfterReady({ supabaseConfigured: false, hasSession: true, hasFamily: true, onboarded: true, trialDeclined: true }) === 'app',
  );
  check('événement : identifiant de famille gardé', eventFamilyId({ id: 'fam_1' }) === 'fam_1');
  check('événement : famille absente ou identifiant vide', eventFamilyId(null) === null && eventFamilyId({ id: '  ' }) === null && eventFamilyId(undefined) === null);
  return out;
}
