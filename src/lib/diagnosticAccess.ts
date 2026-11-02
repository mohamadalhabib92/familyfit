import { useRef } from 'react';

/**
 * L'écran Diagnostic n'est pas un écran produit.
 * Accès : build de développement, ou sept appuis en moins de 4 secondes
 * sur le nom de la famille (Aujourd'hui), le titre de l'onglet Famille,
 * ou le titre de l'écran Connexion.
 * Le drapeau mémoire est synchrone : la navigation ne doit pas dépendre
 * d'une écriture de préférences pas encore peinte.
 */
let memoryUnlocked = false;

export function markDiagnosticUnlocked(): void {
  memoryUnlocked = true;
}

export function clearDiagnosticMemory(): void {
  memoryUnlocked = false;
}

export function diagnosticUnlocked(persisted: boolean): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ ? true : persisted || memoryUnlocked;
}

export function useSecretTap(onUnlock: () => void, need = 7) {
  const taps = useRef<number[]>([]);
  return () => {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t <= 4000);
    taps.current.push(now);
    if (taps.current.length >= need) {
      taps.current = [];
      onUnlock();
    }
  };
}
