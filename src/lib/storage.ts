import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { canPersist, noteLoadFinished, noteLoadStarted, shouldApplyLoad } from './persistGuard';
import {
  QUARANTINE_KEY,
  SCHEMA_META_KEY,
  WRITE_FAILURE_MESSAGE,
  appendQuarantine,
  buildSnapshot,
  payloadWriteAllowed,
  retainUnknown,
  trackAfterEdit,
  trackAfterLoad,
  trackAfterWrite,
  withUnsavedExport,
  type QuarantineReason,
  type Snapshot,
  type TrackedKey,
  type UnsavedExport,
} from './preservation';

/**
 * Stockage local (AsyncStorage sur mobile, localStorage sur le web).
 * Toutes les données « cœur » vivent ici : l'app fonctionne hors-ligne,
 * sans backend ni API payante.
 */
// Préfixe propre à l'app : plusieurs PWA partagent la même origine sur GitHub Pages.
const PREFIX = '@familyfit/';

export type LoadOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'unavailable' }
  | { ok: false; reason: 'corrupt'; raw: string };

/** `corrupt` = le texte est là mais illisible. Ce n'est pas une clé vide. */
export async function loadJSON<T>(key: string, fallback: T): Promise<LoadOutcome<T>> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw == null) return { ok: true, value: fallback };
    try {
      return { ok: true, value: JSON.parse(raw) as T };
    } catch {
      return { ok: false, reason: 'corrupt', raw };
    }
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** Remplace une clé illisible. Uniquement après confirmation explicite. */
export async function replaceUnreadableKey<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
}

let observedSchemaVersion: number | null = null;
let schemaGateOpen = false;
let metaUnreadable = false;

/** Ferme les écritures le temps de relire la version (démarrage ou Réessayer). */
export function closeSchemaGate(): void {
  schemaGateOpen = false;
}

/**
 * Ouvre les écritures après lecture de la métadonnée.
 * `unreadable` laisse la porte fermée aux contenus : forme inconnue ou JSON cassé.
 */
export function openSchemaGate(version: number | null, unreadable: boolean): void {
  observedSchemaVersion = version;
  metaUnreadable = unreadable;
  schemaGateOpen = true;
}

/** Après un effacement confirmé, les nouvelles données appartiennent à cette version. */
export function releaseSchemaGateAfterErase(): void {
  observedSchemaVersion = null;
  metaUnreadable = false;
  schemaGateOpen = true;
}

export function writesAreBlocked(): boolean {
  if (!schemaGateOpen || metaUnreadable) return true;
  return !payloadWriteAllowed(observedSchemaVersion, true);
}

export type SaveResult = { ok: true; skipped: false } | { ok: false; skipped: boolean; error: string };

const tracked = new Map<string, TrackedKey>();
const writeTails = new Map<string, Promise<void>>();
let diskCleared = false;
const writeListeners = new Set<() => void>();

function emitWrites(): void {
  writeListeners.forEach((fn) => fn());
}

export function subscribeWrites(fn: () => void): () => void {
  writeListeners.add(fn);
  return () => writeListeners.delete(fn);
}

export function unsavedEntries(): UnsavedExport[] {
  return [...tracked.values()]
    .filter((row) => row.unsaved)
    .map((row) => ({ key: row.key, error: row.error ?? WRITE_FAILURE_MESSAGE, value: row.memory }));
}

/** Dernière lecture réussie : c’est la copie de référence, pas un brouillon. */
export function noteHydratedValue(key: string, value: unknown): void {
  tracked.set(key, trackAfterLoad(key, value));
  emitWrites();
}

/** Après un effacement confirmé, plus aucune ancienne copie n’est sur le disque. */
export function resetWriteTracker(): void {
  tracked.clear();
  diskCleared = true;
  emitWrites();
}

async function writeNow<T>(key: string, value: T, previous: T | undefined): Promise<SaveResult> {
  if (!canPersist(key)) return { ok: false, skipped: true, error: 'Lecture non terminée' };
  if (writesAreBlocked()) return { ok: false, skipped: true, error: 'Écritures en pause' };
  const existing = tracked.get(key);
  const next = trackAfterEdit(existing, key, previous, value, diskCleared && !existing);
  tracked.set(key, next);
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    tracked.set(key, trackAfterWrite(tracked.get(key) ?? next, true));
    emitWrites();
    return { ok: true, skipped: false };
  } catch {
    tracked.set(key, trackAfterWrite({ ...(tracked.get(key) ?? next), memory: value }, false));
    emitWrites();
    return { ok: false, skipped: false, error: WRITE_FAILURE_MESSAGE };
  }
}

export async function saveJSON<T>(key: string, value: T, previous?: T): Promise<SaveResult> {
  const prev = writeTails.get(key) ?? Promise.resolve();
  let result: SaveResult = { ok: false, skipped: true, error: 'Lecture non terminée' };
  const job = prev.then(() => writeNow(key, value, previous), () => writeNow(key, value, previous)).then((r) => {
    result = r;
  });
  writeTails.set(key, job.then(() => undefined, () => undefined));
  await job;
  return result;
}

export async function retryUnsavedWrites(): Promise<void> {
  const pending = unsavedEntries();
  for (const row of pending) await saveJSON(row.key, row.value);
}

/**
 * Copie brute d'une valeur illisible. N'écrase ni la clé d'origine ni une
 * quarantaine déjà illisible ou d'une forme inconnue.
 */
export async function rememberUnreadable(key: string, raw: string, reason: QuarantineReason): Promise<void> {
  if (key === QUARANTINE_KEY) return;
  try {
    const existing = await AsyncStorage.getItem(PREFIX + QUARANTINE_KEY);
    let current: unknown = [];
    if (existing != null) {
      try {
        current = JSON.parse(existing);
      } catch {
        return;
      }
    }
    if (current != null && !Array.isArray(current)) return;
    const next = appendQuarantine(current, { key, raw, at: new Date().toISOString(), reason });
    await AsyncStorage.setItem(PREFIX + QUARANTINE_KEY, JSON.stringify(next));
  } catch {
    // La clé d'origine reste en place.
  }
}

export async function readSchemaMeta(): Promise<LoadOutcome<unknown>> {
  return loadJSON<unknown>(SCHEMA_META_KEY, null);
}

/** Écriture directe du tampon. L'appelant a déjà décidé qu'elle est sûre. */
export async function writeSchemaMeta(value: Record<string, unknown>): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + SCHEMA_META_KEY, JSON.stringify(value));
  } catch {
    // La métadonnée manquante reste un héritage lisible.
  }
}

export async function clearAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
}

export async function exportAll(): Promise<Record<string, unknown>> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
  const pairs = await AsyncStorage.multiGet(keys);
  const out: Record<string, unknown> = {};
  for (const [k, v] of pairs) {
    try {
      out[k.slice(PREFIX.length)] = v ? JSON.parse(v) : null;
    } catch {
      out[k.slice(PREFIX.length)] = v;
    }
  }
  return out;
}

/** Instantané du disque, plus les brouillons non écrits. Le condensé porte seulement le disque. */
export async function exportSnapshot(exportedAt = new Date().toISOString()): Promise<Snapshot & { unsaved: UnsavedExport[] }> {
  return withUnsavedExport(buildSnapshot(await exportAll(), exportedAt), unsavedEntries());
}

/**
 * État React persistant.
 * Rien n'est écrit tant que la lecture de cette clé n'a pas réussi.
 * `boot` relance la lecture (« Réessayer ») et rebloque les écritures
 * pendant ce temps. `slow` signale un délai, sans substituer l'état vide.
 */
export function usePersistentState<T>(key: string, initial: T | (() => T), boot = 0) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [corruptRaw, setCorruptRaw] = useState<string | null>(null);
  const initialRef = useRef(initial);
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    let alive = true;
    setReady(false);
    setSlow(false);
    noteLoadStarted(key);
    const slowTimer = setTimeout(() => {
      if (alive && shouldApplyLoad(id, request.current)) setSlow(true);
    }, 4000);
    const fb = typeof initialRef.current === 'function' ? (initialRef.current as () => T)() : initialRef.current;
    loadJSON<T>(key, fb).then((result) => {
      if (!alive || !shouldApplyLoad(id, request.current)) return;
      clearTimeout(slowTimer);
      if (!result.ok) {
        noteLoadFinished(key, false);
        if (result.reason === 'corrupt') {
          setCorruptRaw(result.raw);
          void rememberUnreadable(key, result.raw, 'corrupt');
        } else setCorruptRaw(null);
        setSlow(true);
        return;
      }
      noteLoadFinished(key, true);
      noteHydratedValue(key, result.value);
      setCorruptRaw(null);
      setValue(result.value);
      setReady(true);
      setSlow(false);
    });
    return () => {
      alive = false;
      clearTimeout(slowTimer);
    };
  }, [key, boot]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        const kept = (typeof next === 'function' ? retainUnknown(prev, v) : v) as T;
        if (canPersist(key)) void saveJSON(key, kept, prev);
        return kept;
      });
    },
    [key],
  );

  return [value, set, ready, slow, corruptRaw] as const;
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
