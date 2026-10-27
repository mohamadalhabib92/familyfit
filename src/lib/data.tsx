import { createContext, useContext, type ReactNode } from 'react';
import { addDays, todayISO } from './dates';
import { MEMBER_COLORS, type Activity, type Family, type FamilyEvent, type Goal, type Invitation, type Member, type Ritual, type Role, type Session } from './model';
import { demoData } from './seed';
import { clearAll, uid, usePersistentState } from './storage';
import { rpc, type AuthSession } from './supabase';

type Setter<T> = (v: T | ((p: T) => T)) => void;
export type Prefs = { configAck: boolean; onboarded: boolean; hijriOffset: number; showHijri: boolean; filterCats: string[]; filterMembers: string[] };
const DEFAULT_PREFS: Prefs = { configAck: false, onboarded: false, hijriOffset: 0, showHijri: true, filterCats: [], filterMembers: [] };

type Ctx = {
  ready: boolean;
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
  createFamily: (name: string, myName: string, withDemo: boolean) => Promise<void>;
  createInvitation: (role: Role) => Promise<Invitation>;
  revokeInvitation: (id: string) => void;
  acceptInvitation: (code: string, name: string, isMinor: boolean) => Promise<{ ok: boolean; message: string }>;
  hasDemo: boolean; removeDemo: () => void;
  signOut: () => void; wipe: () => Promise<void>;
  remoteError: string | null;
};
const C = createContext<Ctx | null>(null);

const code6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export function DataProvider({ children }: { children: ReactNode }) {
  const [session, setSession, r1] = usePersistentState<AuthSession | null>('session', null);
  const [prefs, setPrefs, r2] = usePersistentState<Prefs>('prefs', DEFAULT_PREFS);
  const [family, setFamily, r3] = usePersistentState<Family | null>('family', null);
  const [members, setMembers, r4] = usePersistentState<Member[]>('members', []);
  const [invitations, setInvitations, r5] = usePersistentState<Invitation[]>('invitations', []);
  const [events, setEvents, r6] = usePersistentState<FamilyEvent[]>('events', []);
  const [rituals, setRituals, r7] = usePersistentState<Ritual[]>('rituals', []);
  const [sessions, setSessions, r8] = usePersistentState<Session[]>('sessions', []);
  const [goals, setGoals, r9] = usePersistentState<Goal[]>('goals', []);
  const [activities, setActivities, r10] = usePersistentState<Activity[]>('activities', []);
  const [remoteError, setRemoteError] = usePersistentState<string | null>('remoteError', null);
  const ready = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10;

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

  const createFamily: Ctx['createFamily'] = async (name, myName, withDemo) => {
    const remoteId = await remote<string>('create_family', { p_name: name, p_display_name: myName });
    const fam: Family = { id: typeof remoteId === 'string' && remoteId ? remoteId : uid('fam_'), name, createdAt: new Date().toISOString() };
    const me: Member = { id: session?.userId || uid('mem_'), familyId: fam.id, name: myName, role: 'admin', color: MEMBER_COLORS[0], isMinor: false, contact: session?.contact, isMe: true };
    setFamily(fam);
    if (withDemo) {
      const d = demoData(fam.id, me);
      setMembers([me, ...d.members]); setEvents(d.events); setRituals(d.rituals); setSessions(d.sessions); setGoals(d.goals); setActivities(d.activities);
    } else {
      setMembers([me]); setEvents([]); setRituals([]); setSessions([]); setGoals([]); setActivities([]);
    }
    setInvitations([]);
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
    const m: Member = { id: uid('mem_'), familyId: inv.familyId, name: name.trim(), role: isMinor ? 'member' : inv.role, color: MEMBER_COLORS[members.length % MEMBER_COLORS.length], isMinor, parentConsentShare: isMinor ? false : undefined };
    setMembers((l) => [...l, m]);
    setInvitations((l) => l.map((i) => (i.id === inv.id ? { ...i, status: 'accepted', acceptedBy: m.id } : i)));
    void remote('accept_invitation', { p_code: code, p_display_name: name });
    return { ok: true, message: `${m.name} a rejoint la famille.` };
  };

  const isDemo = (x: { demo?: boolean; id: string }) => !!x.demo || x.id.startsWith('demo-');
  const hasDemo = members.some(isDemo) || events.some(isDemo) || rituals.some(isDemo) || goals.some(isDemo);
  const removeDemo = () => {
    setMembers((l) => l.filter((x) => !isDemo(x)));
    setEvents((l) => l.filter((x) => !isDemo(x)).map((e) => ({ ...e, memberIds: e.memberIds.filter((id) => !id.startsWith('demo-')) })));
    setRituals((l) => l.filter((x) => !isDemo(x)));
    setSessions((l) => l.filter((x) => !x.ritualId.startsWith('demo-')));
    setGoals((l) => l.filter((x) => !isDemo(x)));
    setActivities((l) => l.filter((x) => !x.goalId.startsWith('demo-') && !x.memberId.startsWith('demo-')));
  };

  const signOut = () => setSession(null);
  const wipe = async () => {
    await clearAll();
    setSession(null); setPrefs(DEFAULT_PREFS); setFamily(null); setMembers([]); setInvitations([]); setEvents([]); setRituals([]); setSessions([]); setGoals([]); setActivities([]);
  };

  const me = members.find((m) => m.isMe) ?? null;
  return (
    <C.Provider
      value={{
        ready, session, setSession, prefs: { ...DEFAULT_PREFS, ...prefs }, setPrefs, family, members, setMembers, me, invitations, events, setEvents,
        rituals, setRituals, sessions, setSessions, goals, setGoals, activities, setActivities, createFamily, createInvitation, revokeInvitation,
        acceptInvitation, hasDemo, removeDemo, signOut, wipe, remoteError,
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
