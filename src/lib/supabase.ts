import { env } from './config';

/** Clés publiques uniquement (anon). Absentes / YOUR_* => mode démo local, écran « Configuration requise ». */
export const SUPABASE_URL = env('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = env('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseConfigured = SUPABASE_URL.configured && SUPABASE_ANON_KEY.configured;

export type AuthSession = { mode: 'supabase' | 'demo'; contact: string; userId: string; accessToken?: string; refreshToken?: string; expiresAt?: number };
export type Channel = 'email' | 'sms';

export class OtpError extends Error {
  constructor(public code: 'expired' | 'invalid' | 'rate_limit' | 'network' | 'config' | 'format' | 'unknown', message: string) {
    super(message);
  }
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
export const isPhone = (s: string) => /^\+[1-9]\d{7,14}$/.test(s.replace(/[\s.-]/g, ''));
export const normContact = (s: string, ch: Channel) => (ch === 'email' ? s.trim().toLowerCase() : s.replace(/[\s.-]/g, ''));

async function call(path: string, body: unknown, token?: string) {
  if (!supabaseConfigured) throw new OtpError('config', 'Supabase n’est pas configuré.');
  let r: Response;
  try {
    r = await fetch(`${SUPABASE_URL.value!.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY.value!, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new OtpError('network', 'Connexion impossible. Vérifiez votre réseau puis réessayez.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const code = String(j.error_code ?? j.code ?? '');
    const msg = String(j.msg ?? j.message ?? j.error_description ?? '');
    if (r.status === 429 || /rate/i.test(code + msg)) throw new OtpError('rate_limit', 'Trop de demandes. Patientez une minute avant de redemander un code.');
    if (/expired/i.test(code + msg)) throw new OtpError('expired', 'Ce code a expiré. Demandez-en un nouveau.');
    if (r.status === 403 || r.status === 401 || /invalid/i.test(code + msg)) throw new OtpError('invalid', 'Code invalide. Vérifiez les 6 chiffres.');
    throw new OtpError('unknown', `Erreur du serveur (${r.status}). Réessayez plus tard.`);
  }
  return j;
}

/** Envoie un OTP 6 chiffres (Supabase GoTrue). Le fournisseur e-mail/SMS est celui configuré dans votre projet Supabase. */
export async function sendOtp(contact: string, ch: Channel) {
  await call('/auth/v1/otp', ch === 'email' ? { email: contact, create_user: true } : { phone: contact, create_user: true });
}

export async function verifyOtp(contact: string, ch: Channel, token: string): Promise<AuthSession> {
  const j = await call('/auth/v1/verify', ch === 'email' ? { type: 'email', email: contact, token } : { type: 'sms', phone: contact, token });
  return { mode: 'supabase', contact, userId: j.user?.id ?? '', accessToken: j.access_token, refreshToken: j.refresh_token, expiresAt: Date.now() + (j.expires_in ?? 3600) * 1000 };
}

/** RPC PostgREST (voir supabase/schema.sql). Ne bloque jamais l’app : l’appelant garde l’état local. */
export async function rpc<T = unknown>(session: AuthSession | null, fn: string, args: Record<string, unknown>): Promise<T | null> {
  if (!supabaseConfigured || session?.mode !== 'supabase' || !session.accessToken) return null;
  return (await call(`/rest/v1/rpc/${fn}`, args, session.accessToken)) as T;
}

/* ---------- Mode démo : OTP simulé, clairement signalé ---------- */
export type DemoOtp = { contact: string; code: string; expiresAt: number; attempts: number; sentAt: number };
export function makeDemoOtp(contact: string): DemoOtp {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  return { contact, code, expiresAt: Date.now() + 10 * 60_000, attempts: 0, sentAt: Date.now() };
}
export function checkDemoOtp(o: DemoOtp | null, token: string): void {
  if (!o) throw new OtpError('expired', 'Aucun code en cours. Demandez un nouveau code.');
  if (Date.now() > o.expiresAt) throw new OtpError('expired', 'Ce code a expiré. Demandez-en un nouveau.');
  if (o.attempts >= 5) throw new OtpError('rate_limit', 'Trop d’essais. Demandez un nouveau code.');
  o.attempts++;
  if (token !== o.code) throw new OtpError('invalid', `Code invalide. ${5 - o.attempts} essai(s) restant(s).`);
}
