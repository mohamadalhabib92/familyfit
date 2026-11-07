import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { addDays, todayISO } from './dates';
import { MEMBER_PALETTE, type Activity, type Family, type FamilyEvent, type FamilyList, type Goal, type Invitation, type Member, type Ritual, type Role, type Session } from './model';
import { demoData } from './seed';
import {
  nextSchemaMeta,
  readSchemaVersion,
  SCHEMA_META_KEY,
  shouldSeedTrial,
  shouldStampSchema,
  STORAGE_SCHEMA_VERSION,
  withoutDemo,
} from './preservation';
import {
  clearAll,
  closeSchemaGate,
  openSchemaGate,
  readSchemaMeta,
  releaseSchemaGateAfterErase,
  rememberUnreadable,
  replaceUnreadableKey,
  saveJSON,
  uid,
  usePersistentState,
  writeSchemaMeta,
} from './storage';
import { signOut as signedOutState } from './gate';
import { rpc, supabaseConfigured, type AuthSession } from './supabase';

type Setter<T> = (v: T | ((p: T) => T)) => void;
export type Prefs = {
  configAck: boolean;
  onboarded: boolean;
  hijriOffset: number;
  showHijri: boolean;
  filterCats: string[];
  filterMembers: string[];
  /** Famille d'exemple affichée sans compte. */
  trialMode: boolean;
  /** L'utilisateur a quitté le mode essai : ne pas réensemencer par-dessus un choix explicite. */
  trialDeclined: boolean;
  devConfigUnlocked: boolean;
  largeText: boolean;
};
const DEFAULT_PREFS: Prefs = {
  configAck: false, onboarded: false, hijriOffset: 0, showHijri: true, filterCats: [], filterMembers: [],
  trialMode: false, trialDeclined: false, devConfigUnlocked: false, largeText: false,
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Ctx = {
  ready: boolean;
  storageSlow: boolean;
  reloadStorage: () => void;
  session: AuthSession | null; setSession: Setter<AuthSession | null>;
  prefs: Prefs; setPrefs: Setter<Prefs>;
  family: Family | null;
  members: Member[]; setMembers: Setter<Member[]>; me: Member | null;
  invitations: Invitation[];
  events: FamilyEvent[]; setEvents: Setter<FamilyEvent[]>;
  rituals: Ritual[]; setRituals: Setter<Ritual[]>;
  sessions: Session[]; setSessions: Setter<Session[]>;
  goals: Goal[]; setGoals: Setter<Goal[]>;
  activities: Activity[]; setActivities: Setter<Activity[]>;
  lists: FamilyList[]; setLists: Setter<FamilyList[]>;
  createFamily: (name: string, myName: string, withDemo: boolean) => Promise<void>;
  createInvitation: (role: Role) => Promise<Invitation>;
  revokeInvitation: (id: string) => void;
  acceptInvitation: (code: string, name: string, isMinor: boolean) => Promise<{ ok: boolean; message: string }>;
  hasDemo: boolean; removeDemo: () => void;
  signOut: () => void; wipe: () => Promise<void>;
  corrupt: { key: string; raw: string }[];
  resetCorrupt: (keys: string[]) => Promise<void>;
  keepTrialData: () => void;
  restartKeepingSession: () => Promise<void>;
  deleteAccount: (transferTo?: string) => Promise<{ ok: boolean; message: string }>;
  remoteError: string | null;
  /** Version future ou métadonnée illisible : les contenus déjà lus ne sont pas réécrits. */
  writesPaused: boolean;
};
const C = createContext<Ctx | null>(null);

const code6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const paletteAt = (i: number) => MEMBER_PALETTE[i % MEMBER_PALETTE.length] ?? MEMBER_PALETTE[0];

export function DataProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState(0);
  const [schemaChecked, setSchemaChecked] = useState(false);
  const [writesPaused, setWritesPaused] = useState(false);
  const [session, setSession, r1, s1, c1] = usePersistentState<AuthSession | null>('session', null, boot);
  const [prefs, setPrefs, r2, s2, c2] = usePersistentState<Prefs>('prefs', DEFAULT_PREFS, boot);
  const [family, setFamily, r3, s3, c3] = usePersistentState<Family | null>('family', null, boot);
  const [members, setMembers, r4, s4, c4] = usePersistentState<Member[]>('members', [], boot);
  const [invitations, setInvitations, r5, s5, c5] = usePersistentState<Invitation[]>('invitations', [], boot);
  const [events, setEvents, r6, s6, c6] = usePersistentState<FamilyEvent[]>('events', [], boot);
  const [rituals, setRituals, r7, s7, c7] = usePersistentState<Ritual[]>('rituals', [], boot);
  const [sessions, setSessions, r8, s8, c8] = usePersistentState<Session[]>('sessions', [], boot);
  const [goals, setGoals, r9, s9, c9] = usePersistentState<Goal[]>('goals', [], boot);
  const [activities, setActivities, r10, s10, c10] = usePersistentState<Activity[]>('activities', [], boot);
  const [lists, setLists, r11, s11, c11] = usePersistentState<FamilyList[]>('lists', [], boot);
  const [remoteError, setRemoteError, r12, , c12] = usePersistentState<string | null>('remoteError', null, boot);
  const ready = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10 && r11 && r12;
  const corrupt = (
    [
      ['session', c1], ['prefs', c2], ['family', c3], ['members', c4], ['invitations', c5], ['events', c6],
      ['rituals', c7], ['sessions', c8], ['goals', c9], ['activities', c10], ['lists', c11], ['remoteError', c12],
    ] as const
  ).flatMap(([key, raw]) => (raw == null ? [] : [{ key, raw }]));
  const emptyFor = (key: string): unknown => {
    if (key === 'prefs') return DEFAULT_PREFS;
    if (key === 'session' || key === 'family' || key === 'remoteError') return null;
    return [];
  };
  const storageSlow = !ready && (s1 || s2 || s3 || s4 || s5 || s6 || s7 || s8 || s9 || s10 || s11);
  const mergedPrefs: Prefs = { ...DEFAULT_PREFS, ...prefs };

  const remote = async <T,>(fn: string, args: Record<string, unknown>): Promise<T | null> => {
    try {
      const r = await rpc<T>(session, fn, args);
      setRemoteError(null);
      return r;
    } catch (e) {
      setRemoteError(`Synchronisation impossible (${fn}) : ${(e as Error).message}. Les données restent enregistrées sur cet appareil.`);
      return null;
    }
  };

  const emptyContent = () => {
    setMembers([]); setInvitations([]); setEvents([]); setRituals([]); setSessions([]); setGoals([]); setActivities([]); setLists([]);
  };

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    closeSchemaGate();
    void (async () => {
      const loaded = await readSchemaMeta();
      if (cancel) return;
      if (!loaded.ok) {
        if (loaded.reason === 'corrupt') await rememberUnreadable(SCHEMA_META_KEY, loaded.raw, 'corrupt');
        openSchemaGate(null, true);
        setWritesPaused(true);
        setSchemaChecked(true);
        return;
      }
      const version = readSchemaVersion(loaded.value);
      if (loaded.value != null && version == null) {
        openSchemaGate(null, true);
        setWritesPaused(true);
        setSchemaChecked(true);
        return;
      }
      if (version != null && version > STORAGE_SCHEMA_VERSION) {
        openSchemaGate(version, false);
        setWritesPaused(true);
        setSchemaChecked(true);
        return;
      }
      if (shouldStampSchema(loaded.value)) await writeSchemaMeta(nextSchemaMeta(loaded.value, new Date().toISOString()));
      openSchemaGate(STORAGE_SCHEMA_VERSION, false);
      setWritesPaused(false);
      setSchemaChecked(true);
    })();
    return () => {
      cancel = true;
    };
  }, [ready, boot]);

  useEffect(() => {
    if (!shouldSeedTrial({
      ready: ready && schemaChecked,
      supabaseConfigured,
      hasSession: !!session,
      hasFamily: !!family,
      trialDeclined: mergedPrefs.trialDeclined,
      writesPaused,
    })) return;
    const fam: Family = { id: uid('fam_'), name: 'Famille Martin (essai)', createdAt: new Date().toISOString(), trial: true };
    const mark = paletteAt(0);
    const me: Member = { id: uid('mem_'), familyId: fam.id, name: 'Alex', role: 'admin', color: mark.color, glyph: mark.glyph, isMinor: false, isMe: true };
    const d = demoData(fam.id, me);
    setFamily(fam);
    setMembers([me, ...d.members]);
    setEvents(d.events);
    setRituals(d.rituals);
    setSessions(d.sessions);
    setGoals(d.goals);
    setActivities(d.activities);
    setLists(d.lists);
    setInvitations([]);
    setSession({ mode: 'demo', contact: '', userId: me.id, trial: true });
    setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, onboarded: true, trialMode: true, configAck: true }));
  }, [ready, schemaChecked, writesPaused, session, family, mergedPrefs.trialDeclined]);

  const createFamily: Ctx['createFamily'] = async (name, myName, withDemo) => {
    if (!ready) return;
    const remoteId = await remote<string>('create_family', { p_name: name, p_display_name: myName });
    const mark = paletteAt(0);
    const fam: Family = { id: typeof remoteId === 'string' && remoteId ? remoteId : uid('fam_'), name, createdAt: new Date().toISOString() };
    const me: Member = { id: session?.userId || uid('mem_'), familyId: fam.id, name: myName, role: 'admin', color: mark.color, glyph: mark.glyph, isMinor: false, contact: session?.contact, isMe: true };
    setFamily(fam);
    if (withDemo) {
      const d = demoData(fam.id, me);
      setMembers([me, ...d.members]); setEvents(d.events); setRituals(d.rituals); setSessions(d.sessions); setGoals(d.goals); setActivities(d.activities); setLists(d.lists);
    } else {
      setMembers([me]); setEvents([]); setRituals([]); setSessions([]); setGoals([]); setActivities([]); setLists([]);
    }
    setInvitations([]);
    setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, trialMode: false, trialDeclined: true }));
  };

  const createInvitation: Ctx['createInvitation'] = async (role) => {
    const r = await remote<{ code: string } | string>('create_invitation', { p_family_id: family?.id, p_role: role });
    const code = typeof r === 'string' ? r : r && typeof r === 'object' && 'code' in r ? r.code : code6();
    const inv: Invitation = { id: uid('inv_'), familyId: family?.id ?? '', code, role, createdAt: new Date().toISOString(), expiresAt: addDays(todayISO(), 7), status: 'pending' };
    setInvitations((l) => [inv, ...l]);
    return inv;
  };
  const revokeInvitation = (id: string) => setInvitations((l) => l.map((i) => (i.id === id ? { ...i, status: 'revoked' } : i)));

  const acceptInvitation: Ctx['acceptInvitation'] = async (raw, name, isMinor) => {
    const code = raw.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return { ok: false, message: 'Le code comporte 6 caractères (lettres et chiffres).' };
    const inv = invitations.find((i) => i.code === code);
    if (!inv) {
      const r = await remote<unknown>('accept_invitation', { p_code: code, p_display_name: name });
      return r ? { ok: true, message: 'Invitation acceptée. Synchronisation de la famille…' } : { ok: false, message: 'Code inconnu sur cet appareil. En mode démo, les invitations ne fonctionnent que sur l’appareil qui les a créées ; configurez Supabase pour inviter d’autres appareils.' };
    }
    if (inv.status !== 'pending') return { ok: false, message: inv.status === 'revoked' ? 'Cette invitation a été révoquée.' : 'Cette invitation a déjà été utilisée.' };
    if (inv.expiresAt < todayISO()) return { ok: false, message: 'Cette invitation a expiré. Demandez un nouveau code.' };
    const mark = paletteAt(members.length);
    const m: Member = { id: uid('mem_'), familyId: inv.familyId, name: name.trim(), role: isMinor ? 'member' : inv.role, color: mark.color, glyph: mark.glyph, isMinor, parentConsentShare: isMinor ? false : undefined };
    setMembers((l) => [...l, m]);
    setInvitations((l) => l.map((i) => (i.id === inv.id ? { ...i, status: 'accepted', acceptedBy: m.id } : i)));
    void remote('accept_invitation', { p_code: code, p_display_name: name });
    return { ok: true, message: `${m.name} a rejoint la famille.` };
  };

  const isDemo = (x: { demo?: boolean; id: string }) => !!x.demo || x.id.startsWith('demo-');
  const hasDemo = members.some(isDemo) || events.some(isDemo) || rituals.some(isDemo) || goals.some(isDemo) || lists.some(isDemo);
  const removeDemo = () => {
    const next = withoutDemo({ members, events, rituals, sessions, goals, activities, lists });
    setMembers(next.members);
    setEvents(next.events);
    setRituals(next.rituals);
    setSessions(next.sessions);
    setGoals(next.goals);
    setActivities(next.activities);
    setLists(next.lists);
  };

  const signOut = () => {
    const next = signedOutState({
      supabaseConfigured,
      session: session ? { userId: session.userId } : null,
      family: family ? { id: family.id } : null,
      onboarded: mergedPrefs.onboarded,
      trialDeclined: mergedPrefs.trialDeclined,
    });
    // Session seule. La famille, l'historique et la quarantaine restent sur l'appareil.
    setSession(next.session ? session : null);
  };
  const resetCorrupt = async (keys: string[]) => {
    const allowed = new Set<string>(corrupt.map((c) => c.key));
    for (const key of keys) {
      if (!allowed.has(key)) continue;
      const raw = corrupt.find((c) => c.key === key)?.raw;
      if (typeof raw === 'string') await rememberUnreadable(key, raw, 'reset-confirmed');
      await replaceUnreadableKey(key, emptyFor(key));
    }
    closeSchemaGate();
    setSchemaChecked(false);
    setBoot((n) => n + 1);
  };
  const wipe = async () => {
    await clearAll();
    releaseSchemaGateAfterErase();
    setWritesPaused(false);
    setSchemaChecked(true);
    await writeSchemaMeta(nextSchemaMeta(null, new Date().toISOString()));
    setSession(null);
    setPrefs({ ...DEFAULT_PREFS, trialDeclined: true });
    setFamily(null);
    emptyContent();
    setRemoteError(null);
  };

  const keepTrialData = () => {
    setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, trialMode: false, trialDeclined: true }));
    setSession((s) => (s ? { ...s, trial: false } : s));
    setFamily((f) => (f ? { ...f, trial: false } : f));
  };

  const restartKeepingSession = async () => {
    const keep = session;
    const largeText = mergedPrefs.largeText;
    const devConfigUnlocked = mergedPrefs.devConfigUnlocked;
    await clearAll();
    releaseSchemaGateAfterErase();
    setWritesPaused(false);
    setSchemaChecked(true);
    await writeSchemaMeta(nextSchemaMeta(null, new Date().toISOString()));
    setFamily(null);
    emptyContent();
    setRemoteError(null);
    setPrefs({ ...DEFAULT_PREFS, trialDeclined: true, configAck: true, largeText, devConfigUnlocked });
    setSession(keep);
    if (keep) void saveJSON('session', keep);
  };

  const deleteAccount: Ctx['deleteAccount'] = async (transferTo) => {
    if (session?.mode === 'supabase') {
      if (!supabaseConfigured || !session.accessToken) {
        return { ok: false, message: 'Session en ligne introuvable. Reconnectez-vous avant de supprimer le compte. Rien n’a été effacé.' };
      }
      const adults = members.filter((m) => !m.isMe && !m.isMinor);
      const soleAdmin = (members.find((m) => m.isMe)?.role === 'admin') && members.filter((m) => m.role === 'admin').length <= 1;
      if (soleAdmin && adults.length > 0) {
        // transferTo est l'id de la fiche family_members, pas le user_id du compte.
        if (!transferTo) return { ok: false, message: 'Choisissez le nouvel administrateur (sa fiche de membre, pas son compte). Rien n’a été effacé.' };
        if (!UUID.test(transferTo)) {
          return { ok: false, message: 'Ce membre n’est pas encore lié à un compte en ligne. Suppression interrompue pour ne pas laisser la famille sans administrateur. Rien n’a été effacé.' };
        }
      }
      try {
        await rpc(session, 'delete_my_account', { p_transfer_to: transferTo && UUID.test(transferTo) ? transferTo : null });
      } catch (e) {
        let msg = e instanceof Error ? e.message : 'Suppression impossible.';
        if (/Transfert admin requis/i.test(msg)) msg = 'Désignez un autre administrateur avant de supprimer le compte.';
        else if (/Successeur invalide/i.test(msg)) msg = 'Cet adulte ne peut pas recevoir l’administration.';
        else if (/Fonction introuvable/i.test(msg)) msg = 'La suppression en ligne n’est pas encore installée. La migration n’a pas été appliquée.';
        else if (/Non authentifié/i.test(msg)) msg = 'Session expirée. Reconnectez-vous, puis réessayez.';
        return { ok: false, message: `${msg} Rien n’a été effacé sur cet appareil.` };
      }
    }
    await wipe();
    return { ok: true, message: session?.mode === 'supabase' ? 'Compte supprimé.' : 'Données de cet appareil supprimées. Il n’y avait pas de compte en ligne.' };
  };

  const me = members.find((m) => m.isMe) ?? null;
  return (
    <C.Provider
      value={{
        ready, storageSlow, reloadStorage: () => { closeSchemaGate(); setSchemaChecked(false); setBoot((n) => n + 1); },
        session, setSession, prefs: mergedPrefs, setPrefs, family, members, setMembers, me, invitations, events, setEvents,
        rituals, setRituals, sessions, setSessions, goals, setGoals, activities, setActivities, lists, setLists,
        createFamily, createInvitation, revokeInvitation, acceptInvitation, hasDemo, removeDemo, signOut, wipe, corrupt, resetCorrupt,
        keepTrialData, restartKeepingSession, deleteAccount, remoteError, writesPaused,
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useData() {
  const c = useContext(C);
  if (!c) throw new Error('DataProvider manquant');
  return c;
}
