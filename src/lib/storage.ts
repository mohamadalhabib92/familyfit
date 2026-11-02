import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { canPersist, noteLoadFinished, noteLoadStarted, shouldApplyLoad } from './persistGuard';

/**
 * Stockage local (AsyncStorage sur mobile, localStorage sur le web).
 * Toutes les données « cœur » vivent ici : l'app fonctionne hors-ligne,
 * sans backend ni API payante.
 */
// Préfixe propre à l'app : plusieurs PWA partagent la même origine sur GitHub Pages.
const PREFIX = '@familyfit/';

export type LoadOutcome<T> = { ok: true; value: T } | { ok: false };

/** `ok: false` = lecture ratée. Ce n'est pas une absence de données. */
export async function loadJSON<T>(key: string, fallback: T): Promise<LoadOutcome<T>> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw == null) return { ok: true, value: fallback };
    try {
      return { ok: true, value: JSON.parse(raw) as T };
    } catch {
      return { ok: false };
    }
  } catch {
    return { ok: false };
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  if (!canPersist(key)) return;
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // stockage plein / indisponible : on ne crashe jamais l'UI
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
        setSlow(true);
        return;
      }
      noteLoadFinished(key, true);
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
        if (canPersist(key)) void saveJSON(key, v);
        return v;
      });
    },
    [key],
  );

  return [value, set, ready, slow] as const;
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
