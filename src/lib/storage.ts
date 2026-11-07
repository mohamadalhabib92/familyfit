import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { canPersist, noteLoadFinished, noteLoadStarted, shouldApplyLoad } from './persistGuard';
import {
  QUARANTINE_KEY,
  SCHEMA_META_KEY,
  appendQuarantine,
  buildSnapshot,
  payloadWriteAllowed,
  retainUnknown,
  type QuarantineReason,
  type Snapshot,
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

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  if (!canPersist(key)) return;
  if (writesAreBlocked()) return;
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // stockage plein / indisponible : on ne crashe jamais l'UI
  }
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

/** Instantané visible : comptes, condensé, copie de quarantaine. Pas une restauration. */
export async function exportSnapshot(exportedAt = new Date().toISOString()): Promise<Snapshot> {
  return buildSnapshot(await exportAll(), exportedAt);
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
        if (canPersist(key)) void saveJSON(key, kept);
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
