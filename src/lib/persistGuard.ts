/**
 * Une écriture n'est autorisée qu'après une lecture réussie de CETTE clé.
 * Un délai, un échec, ou « Réessayer » retire l'autorisation : l'état
 * mémoire (souvent vide) ne doit pas remplacer les données déjà stockées.
 */
const hydrated = new Set<string>();

export function resetPersistGuard(): void {
  hydrated.clear();
}

/** Début de lecture (montage ou Réessayer) : bloque les écritures. */
export function noteLoadStarted(key: string): void {
  hydrated.delete(key);
}

/** Fin de lecture. `ok` est faux si le stockage a échoué ou si le JSON est illisible. */
export function noteLoadFinished(key: string, ok: boolean): void {
  if (ok) hydrated.add(key);
  else hydrated.delete(key);
}

export function canPersist(key: string): boolean {
  return hydrated.has(key);
}

/** Une réponse de lecture périmée (Réessayer lancé entre-temps) ne s'applique pas. */
export function shouldApplyLoad(requestId: number, latestId: number): boolean {
  return requestId === latestId;
}

export function runPersistGuardSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  resetPersistGuard();

  const disk = [{ id: 'kept' }];
  const writes: unknown[] = [];
  const trySave = (key: string, value: unknown) => {
    if (!canPersist(key)) return false;
    writes.push(value);
    if (key === 'events') disk.splice(0, disk.length, ...(value as { id: string }[]));
    return true;
  };

  noteLoadStarted('events');
  check('avant lecture réussie, pas d’écriture', trySave('events', []) === false && disk[0]?.id === 'kept');

  noteLoadFinished('events', false);
  check('échec de lecture : l’état vide n’écrase pas le disque', trySave('events', []) === false && disk.length === 1);

  noteLoadStarted('events');
  check('Réessayer bloque à nouveau', canPersist('events') === false && trySave('events', []) === false);

  noteLoadFinished('events', true);
  check('après lecture réussie, une vraie modification est écrite', trySave('events', [{ id: 'kept' }, { id: 'new' }]) === true && disk.length === 2);

  noteLoadStarted('events');
  check('une relecture en cours ignore l’état mémoire vide', trySave('events', []) === false && disk[0]?.id === 'kept');

  check('réponse périmée ignorée', shouldApplyLoad(1, 2) === false && shouldApplyLoad(2, 2) === true);

  resetPersistGuard();
  return out;
}
