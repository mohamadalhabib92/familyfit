import { env } from './config';

/**
 * Journal de crash optionnel. Aucun appel réseau au démarrage.
 * Désactivé si EXPO_PUBLIC_SENTRY_DSN est absent ou vaut YOUR_SENTRY_DSN.
 * N'envoie jamais de jeton, de clé ou de contenu ressemblant à un JWT.
 */

function scrub(value: string): string {
  return value.replace(/eyJ[A-Za-z0-9_-]{8,}/g, '[redacted]').slice(0, 600);
}

export function sentryConfigured(): boolean {
  return env('EXPO_PUBLIC_SENTRY_DSN', process.env.EXPO_PUBLIC_SENTRY_DSN).configured;
}

function envelopeTarget(): { url: string; key: string } | null {
  const dsn = env('EXPO_PUBLIC_SENTRY_DSN', process.env.EXPO_PUBLIC_SENTRY_DSN);
  if (!dsn.configured || !dsn.value) return null;
  try {
    const u = new URL(dsn.value);
    const key = decodeURIComponent(u.username);
    const project = u.pathname.replace(/\//g, '');
    if (!key || !project || !u.host) return null;
    return { url: `${u.protocol}//${u.host}/api/${project}/envelope/`, key };
  } catch {
    return null;
  }
}

export function captureException(error: unknown, context?: Record<string, string>): void {
  try {
    const target = envelopeTarget();
    if (!target) return;
    const err = error instanceof Error ? error : new Error(scrub(String(error ?? 'erreur')));
    const event = {
      event_id: 'f'.repeat(32).replace(/f/g, () => Math.floor(Math.random() * 16).toString(16)),
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      environment: typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production',
      exception: { values: [{ type: err.name || 'Error', value: scrub(err.message || 'erreur') }] },
      extra: context ? Object.fromEntries(Object.entries(context).map(([k, v]) => [k, scrub(v)])) : undefined,
    };
    const body = JSON.stringify(event);
    const envelope = `{}\n{"type":"event","length":${body.length}}\n${body}`;
    void fetch(target.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${target.key}, sentry_client=familyfit/1.0`,
      },
      body: envelope,
    }).catch(() => undefined);
  } catch {
    // Le journal ne doit jamais faire tomber l'app.
  }
}

export function installCrashHooks(): void {
  const g = globalThis as {
    ErrorUtils?: { getGlobalHandler?: () => (err: unknown, fatal?: boolean) => void; setGlobalHandler?: (fn: (err: unknown, fatal?: boolean) => void) => void };
    __ffCrash?: boolean;
    __ffRej?: boolean;
    addEventListener?: (type: string, fn: (ev: { reason?: unknown }) => void) => void;
  };
  if (!g.__ffCrash && g.ErrorUtils?.setGlobalHandler) {
    g.__ffCrash = true;
    const prev = g.ErrorUtils.getGlobalHandler?.();
    g.ErrorUtils.setGlobalHandler((err, fatal) => {
      captureException(err, { fatal: String(!!fatal) });
      prev?.(err, fatal);
    });
  }
  if (!g.__ffRej && typeof g.addEventListener === 'function') {
    g.__ffRej = true;
    g.addEventListener('unhandledrejection', (ev) => captureException(ev?.reason ?? ev));
  }
}
