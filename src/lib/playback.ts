/**
 * Repli du lecteur : pas de plaque noire si le clip échoue ou n’est pas encore prêt.
 * Aucune clé de stockage. Le geste reste lisible.
 */

export function videoPlaybackFailed(status: unknown): boolean {
  return status === 'error';
}

/**
 * Poster tant que la vidéo n’est pas prête, au plus jusqu’à `reveal`.
 * Une erreur garde le poster. `readyToPlay` l’enlève tout de suite.
 */
export function showVideoPoster(status: unknown, reveal: boolean): boolean {
  if (videoPlaybackFailed(status)) return true;
  if (status === 'readyToPlay') return false;
  return !reveal;
}

/** Seek seulement si les deux temps sont finis, l’écart dépasse le seuil, et le dernier seek n’est pas trop récent. */
export function shouldSeekMedia(currentMs: number, targetMs: number, now: number, lastSeekMs: number, minDrift = 100, minGap = 250): boolean {
  if (!Number.isFinite(currentMs) || !Number.isFinite(targetMs) || targetMs < 0) return false;
  if (!Number.isFinite(now) || !Number.isFinite(lastSeekMs)) return false;
  if (now - lastSeekMs <= minGap) return false;
  return Math.abs(currentMs - targetMs) > minDrift;
}
