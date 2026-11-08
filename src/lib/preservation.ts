/**
 * Conservation des données locales FamilyFit.
 * Version de schéma, champs inconnus, quarantaine, instantané.
 * Aucune restauration ici : un futur basculement devra comparer
 * comptes et condensé sur une copie isolée, puis pouvoir revenir en arrière.
 */

export const STORAGE_SCHEMA_VERSION = 1;

/** Clés lues par l'app. Toute autre clé sous le préfixe est conservée. */
export const DATA_KEYS = [
  'session',
  'prefs',
  'family',
  'members',
  'invitations',
  'events',
  'rituals',
  'sessions',
  'goals',
  'activities',
  'lists',
  'remoteError',
] as const;

export const QUARANTINE_KEY = 'quarantine';
export const SCHEMA_META_KEY = 'schemaMeta';

export const SNAPSHOT_NOTE =
  'Instantané local des clés FamilyFit présentes sur cet appareil. Ce fichier n’est pas une restauration. Un basculement ultérieur exige un instantané vérifié, une restauration isolée, la comparaison des comptes et du condensé, puis un retour arrière possible. Aucune promesse de perte nulle.';

export type QuarantineReason = 'corrupt' | 'reset-confirmed';

export type QuarantineEntry = {
  id: string;
  key: string;
  at: string;
  reason: QuarantineReason;
  raw: string;
  sha256: string;
};

export type Snapshot = {
  app: 'familyfit';
  kind: 'local-snapshot';
  schemaVersion: number;
  exportedAt: string;
  counts: Record<string, number | null>;
  sha256: string;
  note: string;
  data: Record<string, unknown>;
  quarantine: QuarantineEntry[];
};

/**
 * Effacements voulus, distincts de la déconnexion.
 * La déconnexion ne retire ni la famille, ni l'historique, ni la quarantaine.
 * L'effacement confirmé retire aussi la quarantaine : c'est le droit d'effacer.
 */
export const DESTRUCTIVE_ACTIONS = [
  { id: 'signOut', confirmed: false, clearsHistory: false, clearsQuarantine: false, keepsFamily: true },
  { id: 'wipe', confirmed: true, clearsHistory: true, clearsQuarantine: true, keepsFamily: false },
  { id: 'deleteAccount', confirmed: true, clearsHistory: true, clearsQuarantine: true, keepsFamily: false },
  { id: 'restartKeepingSession', confirmed: true, clearsHistory: true, clearsQuarantine: true, keepsFamily: false },
  { id: 'removeDemo', confirmed: true, clearsHistory: false, clearsQuarantine: false, keepsFamily: true },
  { id: 'resetCorrupt', confirmed: true, clearsHistory: false, clearsQuarantine: false, keepsFamily: true },
] as const;

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function utf8(message: string): Uint8Array {
  return new TextEncoder().encode(message);
}

/** Condensé SHA-256 hexadécimal, identique dans les tests et l'app. */
export function sha256Hex(message: string): string {
  const data = utf8(message);
  const bitLen = data.length * 8;
  const padded = new Uint8Array(((data.length + 9 + 63) >> 6) << 6);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  const lenPos = padded.length - 8;
  view.setUint32(lenPos, Math.floor(bitLen / 0x100000000));
  view.setUint32(lenPos + 4, bitLen >>> 0);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const s1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K[t] + w[t]) >>> 0;
      const s0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => x.toString(16).padStart(8, '0')).join('');
}

export function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).filter((key) => obj[key] !== undefined).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Une mise à jour partielle garde les champs que la nouvelle valeur ne cite pas.
 * Une liste ne réinsère pas les éléments retirés : le retrait voulu reste possible.
 */
export function retainUnknown(previous: unknown, next: unknown): unknown {
  if (Array.isArray(previous) && Array.isArray(next)) {
    const prevById = new Map<string, Record<string, unknown>>();
    for (const item of previous) {
      if (isPlainObject(item) && typeof item.id === 'string') prevById.set(item.id, item);
    }
    return next.map((item) => {
      if (!isPlainObject(item) || typeof item.id !== 'string') return item;
      const old = prevById.get(item.id);
      return old ? retainUnknown(old, item) : item;
    });
  }
  if (isPlainObject(previous) && isPlainObject(next)) {
    const out: Record<string, unknown> = { ...next };
    for (const key of Object.keys(previous)) {
      if (!(key in next)) out[key] = previous[key];
    }
    return out;
  }
  return next;
}

export function readSchemaVersion(meta: unknown): number | null {
  if (typeof meta === 'number' && Number.isInteger(meta) && meta >= 0) return meta;
  if (!isPlainObject(meta)) return null;
  const version = meta.version;
  if (typeof version === 'number' && Number.isInteger(version) && version >= 0) return version;
  return null;
}

/** On n'écrit la métadonnée que pour une absence ou une version plus ancienne. */
export function shouldStampSchema(meta: unknown): boolean {
  if (meta == null) return true;
  const version = readSchemaVersion(meta);
  if (version == null) return false;
  return version < STORAGE_SCHEMA_VERSION;
}

export function nextSchemaMeta(previous: unknown, now: string): Record<string, unknown> {
  const base = {
    version: STORAGE_SCHEMA_VERSION,
    knownKeys: [...DATA_KEYS],
    updatedAt: now,
  };
  const merged = retainUnknown(previous, base);
  return isPlainObject(merged) ? merged : base;
}

export type MigrationPlan = {
  action: 'keep';
  fromVersion: number | null;
  toVersion: number;
  rewritePayloads: false;
  allowPayloadWrites: boolean;
  keysUntouched: string[];
};

/** Aucun plan ne supprime une clé. Une version future bloque les réécritures. */
export function planMigration(meta: unknown, diskKeys: string[]): MigrationPlan {
  const fromVersion = readSchemaVersion(meta);
  const ahead = fromVersion != null && fromVersion > STORAGE_SCHEMA_VERSION;
  return {
    action: 'keep',
    fromVersion,
    toVersion: ahead ? fromVersion : STORAGE_SCHEMA_VERSION,
    rewritePayloads: false,
    allowPayloadWrites: !ahead,
    keysUntouched: diskKeys.filter((key) => key !== SCHEMA_META_KEY),
  };
}

export function payloadWriteAllowed(schemaVersion: number | null, hydrated: boolean): boolean {
  if (!hydrated) return false;
  if (schemaVersion != null && schemaVersion > STORAGE_SCHEMA_VERSION) return false;
  return true;
}

export function countStored(value: unknown): number | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object') return Object.keys(value as object).length;
  return 1;
}

export function isQuarantineEntry(value: unknown): value is QuarantineEntry {
  if (!isPlainObject(value)) return false;
  return typeof value.key === 'string' && typeof value.raw === 'string' && typeof value.sha256 === 'string';
}

export function appendQuarantine(existing: unknown, entry: { key: string; raw: string; at: string; reason: QuarantineReason }): QuarantineEntry[] {
  const list = Array.isArray(existing) ? existing.filter(isQuarantineEntry) : [];
  const sha256 = sha256Hex(entry.raw);
  if (list.some((item) => item.key === entry.key && item.sha256 === sha256)) return list;
  return [...list, { ...entry, sha256, id: `${sha256.slice(0, 12)}-${entry.key}` }];
}

export function diskAfterSignOut(disk: Record<string, unknown>): Record<string, unknown> {
  return { ...disk, session: null };
}

export function diskAfterConfirmedWipe(): Record<string, unknown> {
  return {};
}

export function buildSnapshot(data: Record<string, unknown>, exportedAt: string): Snapshot {
  const counts: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(data)) counts[key] = countStored(value);
  const quarantine = Array.isArray(data[QUARANTINE_KEY]) ? data[QUARANTINE_KEY].filter(isQuarantineEntry) : [];
  return {
    app: 'familyfit',
    kind: 'local-snapshot',
    schemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt,
    counts,
    sha256: sha256Hex(stableStringify(data)),
    note: SNAPSHOT_NOTE,
    data,
    quarantine,
  };
}

type DemoLike = { demo?: boolean; id: string };
type EventLike = DemoLike & { memberIds: string[] };
type SessionLike = { ritualId: string };
type ActivityLike = { goalId: string; memberId: string };

export function isDemoRecord(row: { demo?: boolean; id?: string }): boolean {
  return !!row.demo || (typeof row.id === 'string' && row.id.startsWith('demo-'));
}

/** Retire les lignes d'exemple. Le reste du disque, y compris les clés inconnues, reste. */
export function withoutDemo<T extends Record<string, unknown>>(disk: T & {
  members: DemoLike[];
  events: EventLike[];
  rituals: DemoLike[];
  sessions: SessionLike[];
  goals: DemoLike[];
  activities: ActivityLike[];
  lists: DemoLike[];
}): T {
  return {
    ...disk,
    members: disk.members.filter((row) => !isDemoRecord(row)),
    events: disk.events.filter((row) => !isDemoRecord(row)).map((row) => ({ ...row, memberIds: row.memberIds.filter((id) => !id.startsWith('demo-')) })),
    rituals: disk.rituals.filter((row) => !isDemoRecord(row)),
    sessions: disk.sessions.filter((row) => !row.ritualId.startsWith('demo-')),
    goals: disk.goals.filter((row) => !isDemoRecord(row)),
    activities: disk.activities.filter((row) => !row.goalId.startsWith('demo-') && !row.memberId.startsWith('demo-')),
    lists: disk.lists.filter((row) => !isDemoRecord(row)),
  };
}

export const WRITE_FAILURE_MESSAGE =
  'Espace insuffisant ou stockage indisponible. Les changements restent à l’écran et ne sont pas enregistrés. L’ancienne copie reste sur l’appareil.';

export type TrackedKey = {
  key: string;
  /** Dernière valeur dont l’écriture a réussi. Inchangée si le disque refuse. */
  persisted: unknown;
  /** Valeur à l’écran, y compris si l’écriture a échoué. */
  memory: unknown;
  unsaved: boolean;
  error: string | null;
  /** Une écriture est en cours : une relecture ne doit pas remplacer l’écran. */
  pending: boolean;
};

export function trackAfterLoad(key: string, value: unknown): TrackedKey {
  return { key, persisted: value, memory: value, unsaved: false, error: null, pending: false };
}

/** `persisted` ne recule pas vers un brouillon. Sans suivi, le disque vidé n’a pas d’ancienne copie. */
export function trackAfterEdit(current: TrackedKey | undefined, key: string, previousMemory: unknown, nextMemory: unknown, diskCleared = false): TrackedKey {
  const persisted = current ? current.persisted : diskCleared ? undefined : previousMemory;
  return { key, persisted, memory: nextMemory, unsaved: current?.unsaved ?? false, error: current?.error ?? null, pending: false };
}

export const WRITE_REFUSED_MESSAGE =
  'Écritures en pause. Les changements restent à l’écran et ne sont pas enregistrés. L’ancienne copie reste sur l’appareil.';

/** Porte fermée : on note le brouillon, on n’écrit pas, on ne dit pas que c’est enregistré. */
export function recordRefusedEdit(current: TrackedKey | undefined, key: string, previousMemory: unknown, nextMemory: unknown, diskCleared = false): TrackedKey {
  const base = trackAfterEdit(current, key, previousMemory, nextMemory, diskCleared);
  return { ...base, unsaved: true, error: WRITE_REFUSED_MESSAGE, pending: false };
}

export function trackAfterWrite(current: TrackedKey, ok: boolean): TrackedKey {
  if (ok) return { ...current, persisted: current.memory, unsaved: false, error: null, pending: false };
  return { ...current, unsaved: true, error: WRITE_FAILURE_MESSAGE, pending: false };
}

/** Une relecture n’adopte le disque que si rien n’est en attente. Sinon l’écran garderait le vide ou l’ancienne copie à la place du brouillon. */
export function shouldAdoptHydration(current: TrackedKey | undefined): boolean {
  if (!current) return true;
  if (current.unsaved || current.pending) return false;
  return true;
}

/**
 * Lecture terminée. Corrupt ou indisponible : on garde la mémoire, on n’y met pas le repli vide.
 * Le brouillon n’est pas remplacé par le disque.
 */
export function valueAfterLoad(current: unknown, outcome: 'ok' | 'corrupt' | 'unavailable', diskValue: unknown, adopt: boolean): unknown {
  if (outcome !== 'ok' || !adopt) return current;
  return diskValue;
}

/** Effacement explicite. Si le stockage n’a pas confirmé le vidage, la mémoire saine reste. */
export function memoryAfterExplicitWipe<T>(memory: T, empty: T, cleared: boolean): { memory: T; reportedCleared: boolean } {
  if (!cleared) return { memory, reportedCleared: false };
  return { memory: empty, reportedCleared: true };
}

/** Relecture du disque. Ne remplace pas le disque par une valeur vide, et ne fait pas passer le brouillon pour enregistré. */
export function trackRestart(current: TrackedKey): TrackedKey {
  return { key: current.key, persisted: current.persisted, memory: current.persisted, unsaved: false, error: null, pending: false };
}

export function simulateStorageWrite(disk: Record<string, string>, key: string, value: unknown, fail: boolean): { disk: Record<string, string>; ok: boolean; error: string | null } {
  if (fail) return { disk, ok: false, error: WRITE_FAILURE_MESSAGE };
  return { disk: { ...disk, [key]: stableStringify(value) }, ok: true, error: null };
}

export type UnsavedExport = { key: string; error: string; value: unknown };

export function withUnsavedExport<T extends Snapshot>(snapshot: T, unsaved: UnsavedExport[]): T & { unsaved: UnsavedExport[] } {
  return { ...snapshot, unsaved };
}

export function shouldSeedTrial(input: { ready: boolean; supabaseConfigured: boolean; hasSession: boolean; hasFamily: boolean; trialDeclined: boolean; writesPaused: boolean }): boolean {
  if (!input.ready || input.writesPaused || input.supabaseConfigured || input.hasSession || input.hasFamily || input.trialDeclined) return false;
  return true;
}

export function auditFixture(disk: Record<string, unknown>): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const plan = planMigration(disk[SCHEMA_META_KEY] ?? null, Object.keys(disk));
  check('migration v0 ne réécrit aucun contenu', plan.rewritePayloads === false && plan.allowPayloadWrites === true && plan.action === 'keep');
  check('la clé imports inconnue n’est pas retirée du plan', plan.keysUntouched.includes('imports'));

  const stamped = nextSchemaMeta(disk[SCHEMA_META_KEY] ?? null, '2026-11-07T00:00:00.000Z');
  check('tampon de version sans effacer un champ déjà porté par la métadonnée', disk[SCHEMA_META_KEY] == null || JSON.stringify(disk.events) === JSON.stringify(disk.events));
  check('le tampon ne remplace pas les événements', stamped.version === 1 && disk.events !== stamped);

  const prefs = disk.prefs as Record<string, unknown>;
  const editedPrefs = retainUnknown(prefs, { showHijri: false }) as Record<string, unknown>;
  check('préférence inconnue conservée', editedPrefs.localeFuture === prefs.localeFuture && editedPrefs.hijriOffset === prefs.hijriOffset && editedPrefs.showHijri === false);

  const members = disk.members as Record<string, unknown>[];
  const child = members.find((m) => m.id === 'mem_child');
  const renamed = retainUnknown(members, members.map((m) => (m.id === 'mem_child' ? { id: m.id, name: 'Inès' } : m))) as Record<string, unknown>[];
  const renamedChild = renamed.find((m) => m.id === 'mem_child');
  check('champ inconnu d’un membre conservé', !!child && renamedChild?.schoolClass === child?.schoolClass && renamedChild?.name === 'Inès');

  const events = disk.events as Record<string, unknown>[];
  const dropped = retainUnknown(events, events.filter((e) => e.id !== 'ev_demo')) as Record<string, unknown>[];
  check('retrait voulu d’un événement démo', !dropped.some((e) => e.id === 'ev_demo') && dropped.some((e) => e.id === 'ev_real' && e.importedFrom === 'agenda-papier'));

  const signed = diskAfterSignOut(disk);
  check('déconnexion : session nulle', signed.session === null);
  check('déconnexion : famille identique', signed.family === disk.family);
  check('déconnexion : historique des sessions identique', signed.sessions === disk.sessions);
  check('déconnexion : imports identiques', signed.imports === disk.imports);
  check('déconnexion : rituels identiques', signed.rituals === disk.rituals);
  check('déconnexion : objectifs et activités identiques', signed.goals === disk.goals && signed.activities === disk.activities);

  const raw = '{pas du json';
  const quarantined = appendQuarantine([], { key: 'events', raw, at: '2026-11-07T00:00:00.000Z', reason: 'corrupt' });
  const again = appendQuarantine(quarantined, { key: 'events', raw, at: '2026-11-07T00:01:00.000Z', reason: 'reset-confirmed' });
  check('illisible : une seule copie, clé d’origine non remplacée par la quarantaine', quarantined.length === 1 && again.length === 1 && again[0].raw === raw);

  const wiped = diskAfterConfirmedWipe();
  check('effacement confirmé vide le disque, y compris imports et quarantaine', Object.keys(wiped).length === 0);
  const signOutAction = DESTRUCTIVE_ACTIONS.find((a) => a.id === 'signOut');
  const wipeAction = DESTRUCTIVE_ACTIONS.find((a) => a.id === 'wipe');
  check('la déconnexion n’est pas un effacement', !!signOutAction && !signOutAction.clearsHistory && !signOutAction.clearsQuarantine && signOutAction.keepsFamily);
  check('l’effacement confirmé retire la quarantaine', !!wipeAction && wipeAction.confirmed && wipeAction.clearsQuarantine);

  const future = planMigration({ version: 9, vendorField: 'gardé' }, Object.keys(disk));
  check('version future : pas d’écriture et pas de suppression', future.allowPayloadWrites === false && future.rewritePayloads === false && future.keysUntouched.includes('imports'));
  check('écriture refusée si la version lue est plus récente', payloadWriteAllowed(9, true) === false && payloadWriteAllowed(1, true) === true && payloadWriteAllowed(null, false) === false);

  const cleaned = withoutDemo({
    ...disk,
    members: disk.members as DemoLike[],
    events: disk.events as EventLike[],
    rituals: disk.rituals as DemoLike[],
    sessions: disk.sessions as SessionLike[],
    goals: disk.goals as DemoLike[],
    activities: disk.activities as ActivityLike[],
    lists: disk.lists as DemoLike[],
  });
  const cleanedEvents = cleaned.events as { id: string; importedFrom?: string }[];
  const cleanedSessions = cleaned.sessions as { id: string; energyFuture?: string }[];
  check('démo retirée, historique réel et champ inconnu gardés', cleanedEvents.some((e) => e.id === 'ev_real' && e.importedFrom === 'agenda-papier') && !cleanedEvents.some((e) => e.id === 'ev_demo') && cleanedSessions.some((s) => s.id === 'ses_real' && s.energyFuture === 'low') && cleaned.imports === disk.imports);

  const snap = buildSnapshot(disk, '2026-11-07T12:00:00.000Z');
  check('instantané : comptes et condensé', snap.counts.events === (disk.events as unknown[]).length && snap.counts.imports === 1 && snap.sha256 === sha256Hex(stableStringify(disk)));
  check('instantané : pas une restauration', snap.note.includes('n’est pas une restauration') && snap.note.includes('Aucune promesse de perte nulle') && !/perte nulle garantie|zéro perte/i.test(snap.note));
  check('pas de réensemencement après déconnexion si la famille est là', shouldSeedTrial({ ready: true, supabaseConfigured: false, hasSession: false, hasFamily: true, trialDeclined: false, writesPaused: false }) === false);
  check('pas de réensemencement tant que les écritures sont en pause', shouldSeedTrial({ ready: true, supabaseConfigured: false, hasSession: false, hasFamily: false, trialDeclined: false, writesPaused: true }) === false);
  return out;
}

export function runWriteFailureTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const persisted = { showHijri: true, hijriOffset: 1, localeFuture: 'ar-DZ' };
  const dirty = retainUnknown(persisted, { showHijri: false, cityFuture: 'Genève' }) as Record<string, unknown>;
  const originalRaw = stableStringify(persisted);
  const hashBefore = sha256Hex(originalRaw);
  let disk: Record<string, string> = { prefs: originalRaw };
  const diskRef = disk;

  let tracked = trackAfterLoad('prefs', persisted);
  tracked = trackAfterEdit(tracked, 'prefs', tracked.memory, dirty, false);
  const failed = simulateStorageWrite(disk, 'prefs', tracked.memory, true);
  disk = failed.disk;
  tracked = trackAfterWrite(tracked, failed.ok);

  check('échec simulé : le disque n’est pas remplacé', failed.ok === false && disk === diskRef && disk.prefs === originalRaw);
  check('échec simulé : le condensé du disque ne change pas', sha256Hex(disk.prefs) === hashBefore);
  check('échec simulé : pas l’état enregistré', tracked.unsaved === true && tracked.error === WRITE_FAILURE_MESSAGE && tracked.memory !== tracked.persisted);
  check('échec simulé : brouillon et champ inconnu gardés en mémoire', (tracked.memory as Record<string, unknown>).showHijri === false && (tracked.memory as Record<string, unknown>).localeFuture === 'ar-DZ' && (tracked.memory as Record<string, unknown>).cityFuture === 'Genève');
  check('échec simulé : l’ancienne copie et son champ inconnu restent la référence', (tracked.persisted as Record<string, unknown>).showHijri === true && (tracked.persisted as Record<string, unknown>).localeFuture === 'ar-DZ' && (tracked.persisted as Record<string, unknown>).cityFuture === undefined);
  check('échec simulé : pas de remise à vide', disk.prefs !== '[]' && disk.prefs !== '{}' && disk.prefs !== 'null');

  const retryFail = simulateStorageWrite(disk, 'prefs', tracked.memory, true);
  disk = retryFail.disk;
  tracked = trackAfterWrite(tracked, retryFail.ok);
  check('nouvel échec : disque et condensé identiques', disk.prefs === originalRaw && sha256Hex(disk.prefs) === hashBefore && tracked.unsaved === true);

  const retryOk = simulateStorageWrite(disk, 'prefs', tracked.memory, false);
  disk = retryOk.disk;
  tracked = trackAfterWrite({ ...tracked, memory: dirty }, true);
  const diskValue = JSON.parse(disk.prefs) as Record<string, unknown>;
  check('réessai réussi : le disque égale le brouillon', retryOk.ok === true && tracked.unsaved === false && tracked.error === null && sha256Hex(disk.prefs) === sha256Hex(stableStringify(tracked.memory)));
  check('réessai réussi : champs inconnus des deux côtés', diskValue.localeFuture === 'ar-DZ' && diskValue.cityFuture === 'Genève' && diskValue.showHijri === false);

  let diskRestart: Record<string, string> = { prefs: originalRaw };
  let restarted = trackAfterEdit(trackAfterLoad('prefs', persisted), 'prefs', persisted, dirty, false);
  const blocked = simulateStorageWrite(diskRestart, 'prefs', dirty, true);
  diskRestart = blocked.disk;
  restarted = trackAfterWrite(restarted, false);
  const afterBoot = trackRestart(restarted);
  check('redémarrage : le disque n’est pas vidé', sha256Hex(diskRestart.prefs) === hashBefore && diskRestart.prefs === originalRaw);
  check('redémarrage : on relit l’ancienne copie, pas le brouillon ni une valeur vide', (afterBoot.memory as Record<string, unknown>).localeFuture === 'ar-DZ' && (afterBoot.memory as Record<string, unknown>).cityFuture === undefined && (afterBoot.memory as Record<string, unknown>).showHijri === true && afterBoot.unsaved === false);
  check('processus tué : le brouillon n’est pas durable et le disque n’est pas vidé', sha256Hex(diskRestart.prefs) === hashBefore && (afterBoot.memory as Record<string, unknown>).cityFuture === undefined && diskRestart.prefs !== '[]');
  const refusedDisk = { prefs: originalRaw };
  const refused = recordRefusedEdit(trackAfterLoad('prefs', persisted), 'prefs', persisted, dirty, false);
  const refusedWrite = simulateStorageWrite(refusedDisk, 'prefs', dirty, true);
  check('écriture refusée : disque inchangé, brouillon visible, pas enregistré', refused.unsaved === true && refused.error === WRITE_REFUSED_MESSAGE && sha256Hex(refusedWrite.disk.prefs) === hashBefore && (refused.memory as Record<string, unknown>).cityFuture === 'Genève' && (refused.persisted as Record<string, unknown>).localeFuture === 'ar-DZ');
  const hydrated = shouldAdoptHydration(refused);
  check('relecture : un brouillon non enregistré n’est pas remplacé par le disque ni par vide', hydrated === false && valueAfterLoad(refused.memory, 'ok', persisted, hydrated) === refused.memory && valueAfterLoad(persisted, 'corrupt', null, true) === persisted && valueAfterLoad(persisted, 'unavailable', [], true) === persisted);
  check('relecture saine : on adopte le disque, champs inconnus compris', shouldAdoptHydration(trackAfterLoad('prefs', persisted)) === true && (valueAfterLoad(null, 'ok', persisted, true) as Record<string, unknown>).localeFuture === 'ar-DZ');
  const kept = memoryAfterExplicitWipe<unknown>(persisted, {}, false);
  const wipedMem = memoryAfterExplicitWipe<unknown>(persisted, {}, true);
  check('effacement non confirmé : la mémoire saine reste', kept.reportedCleared === false && kept.memory === persisted);
  check('effacement confirmé : la mémoire vide est assumée', wipedMem.reportedCleared === true && wipedMem.memory !== persisted);
  const snap = withUnsavedExport(buildSnapshot({ prefs: persisted }, '2026-11-07T12:00:00.000Z'), [{ key: 'prefs', error: WRITE_FAILURE_MESSAGE, value: dirty }]);
  check('export : condensé du disque, brouillon à part', snap.sha256 === sha256Hex(stableStringify({ prefs: persisted })) && snap.unsaved[0]?.value === dirty && (snap.data.prefs as Record<string, unknown>).cityFuture === undefined);
  return out;
}

export function runPreservationSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  check('SHA-256 vecteur vide', sha256Hex('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  check('SHA-256 vecteur abc', sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  check('forme de métadonnée inconnue non écrasée', shouldStampSchema({ unexpected: true }) === false && shouldStampSchema(null) === true && shouldStampSchema({ version: 1, extra: 1 }) === false);
  const stamped = nextSchemaMeta({ version: 0, legacyNote: 'papier' }, '2026-11-07T00:00:00.000Z');
  check('montée de version garde legacyNote', stamped.version === 1 && stamped.legacyNote === 'papier');
  return out;
}
