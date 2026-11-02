import { env } from './config';

/**
 * Journalisation des plantages.
 * EXPO_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN ou absent → désactivé, aucun appel réseau.
 * Aucun envoi au démarrage : reportCrash n'est appelé qu'après une erreur.
 * Le SDK natif n'est pas chargé (il imposerait une init au lancement).
 */
const DSN = env('EXPO_PUBLIC_SENTRY_DSN', process.env.EXPO_PUBLIC_SENTRY_DSN);

export function sentryEnabled(): boolean {
  return DSN.configured;
}

function parseDsn(dsn: string): { key: string; store: string } | null {
  try {
    const u = new URL(dsn);
    const key = decodeURIComponent(u.username);
    const project = u.pathname.replace(/\//g, '');
    if (!key || !project || !u.host) return null;
    return { key, store: `${u.protocol}//${u.host}/api/${project}/store/` };
  } catch {
    return null;
  }
}

function eventId(): string {
  const bytes = new Uint8Array(16);
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) cryptoObj.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** N'envoie ni jeton, ni contact, ni contenu familial. Ne jette jamais. */
export function reportCrash(error: unknown, context = 'error'): void {
  try {
    const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Erreur');
    console.error('[FamilyFit]', context, err.name, err.message);
    if (!DSN.configured || !DSN.value) return;
    const parsed = parseDsn(DSN.value);
    if (!parsed) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    void fetch(parsed.store, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=familyfit/1.0, sentry_key=${parsed.key}`,
      },
      body: JSON.stringify({
        event_id: eventId(),
        timestamp: new Date().toISOString(),
        platform: 'javascript',
        level: 'error',
        message: { formatted: err.message.slice(0, 300) },
        exception: { values: [{ type: err.name, value: err.message.slice(0, 300) }] },
        tags: { context: context.slice(0, 40) },
      }),
    })
      .catch(() => undefined)
      .finally(() => clearTimeout(timer));
  } catch {
    // le journal ne doit jamais provoquer un second plantage
  }
}

let installed = false;

/** Filet global (promesses, erreurs JS). Idempotent, sans appel réseau. */
export function installCrashHandler(): void {
  if (installed) return;
  installed = true;
  const g = globalThis as typeof globalThis & {
    ErrorUtils?: { getGlobalHandler?: () => (e: unknown, fatal?: boolean) => void; setGlobalHandler?: (h: (e: unknown, fatal?: boolean) => void) => void };
  };
  const eu = g.ErrorUtils;
  if (eu?.setGlobalHandler) {
    const prev = eu.getGlobalHandler?.();
    eu.setGlobalHandler((error, fatal) => {
      reportCrash(error, fatal ? 'fatal' : 'global');
      prev?.(error, fatal);
    });
  }
  if (typeof addEventListener === 'function') {
    addEventListener('error', (event) => {
      const e = event as ErrorEvent;
      reportCrash(e.error ?? e.message, 'window');
    });
    addEventListener('unhandledrejection', (event) => {
      const e = event as PromiseRejectionEvent;
      reportCrash(e.reason, 'unhandledrejection');
    });
  }
}
