/** Marges 10 pieds. La surface utile suit l’écran réel, pas une carte de 360 pt. */
export const TV_SAFE = { horizontal: 90, vertical: 60 };

export type TvSize = { width: number; height: number };

export function tvSafeSize(screen: TvSize): TvSize {
  return {
    width: Math.max(0, Math.round(screen.width - TV_SAFE.horizontal * 2)),
    height: Math.max(0, Math.round(screen.height - TV_SAFE.vertical * 2)),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type ProfileGrid = {
  columns: number;
  rows: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  scroll: boolean;
};

/** Grille qui occupe toute la largeur sûre. La hauteur de carte reste lisible à 3 mètres. */
export function profileGrid(screen: TvSize, count: number): ProfileGrid {
  const safe = tvSafeSize(screen);
  const gap = 28;
  const n = Math.max(0, Math.floor(count));
  const areaH = Math.max(140, safe.height - 168);
  if (n === 0 || safe.width <= 0) {
    return { columns: 1, rows: 0, cardWidth: safe.width, cardHeight: 0, gap, scroll: false };
  }
  let bestCols = 1;
  let bestScore = -1;
  const maxCols = Math.min(n, 5);
  for (let columns = 1; columns <= maxCols; columns += 1) {
    const rows = Math.ceil(n / columns);
    const cardWidth = (safe.width - gap * (columns - 1)) / columns;
    const rawH = (areaH - gap * (rows - 1)) / rows;
    const cardHeight = Math.min(280, rawH);
    if (cardWidth < 240 || cardHeight < 120) continue;
    const usedH = rows * cardHeight + gap * (rows - 1);
    const fillH = Math.min(1, usedH / areaH);
    const balance = 1 - Math.min(1, Math.abs(cardWidth / cardHeight - 2.2) / 3);
    const score = 0.55 + fillH * 0.3 + balance * 0.15;
    if (score > bestScore) {
      bestScore = score;
      bestCols = columns;
    }
  }
  const columns = bestCols;
  const rows = Math.ceil(n / columns);
  const cardWidth = Math.floor((safe.width - gap * (columns - 1)) / columns);
  const rawH = (areaH - gap * (rows - 1)) / rows;
  const cardHeight = Math.floor(Math.min(280, Math.max(120, rawH)));
  const usedH = rows * cardHeight + gap * (rows - 1);
  return { columns, rows, cardWidth, cardHeight, gap, scroll: usedH > areaH + 1 };
}

export type WorkoutFrame = {
  leftWidth: number;
  rightWidth: number;
  gap: number;
  coachSize: number;
  timerSize: number;
  fitsWithoutScroll: boolean;
};

/** Deux colonnes : la liste à gauche, le minuteur et le geste en cours à droite, dans la hauteur sûre. */
export function workoutColumns(screen: TvSize): WorkoutFrame {
  const safe = tvSafeSize(screen);
  const gap = 36;
  const leftWidth = Math.round(clamp(safe.width * 0.3, 260, Math.max(260, safe.width * 0.36)));
  const rightWidth = Math.max(0, safe.width - leftWidth - gap);
  const coachSize = Math.round(clamp(safe.height * 0.16, 88, 150));
  const timerSize = Math.round(clamp(safe.height * 0.09, 56, 84));
  const estimated = coachSize + timerSize + 168;
  return {
    leftWidth,
    rightWidth,
    gap,
    coachSize,
    timerSize,
    fitsWithoutScroll: estimated <= safe.height && rightWidth >= 480,
  };
}

/** Une séance en cours ne change pas de routine en silence. */
export function canSwitchRoutine(running: boolean, currentId: string, nextId: string): boolean {
  return !running || nextId === currentId;
}

/**
 * Un seul focus préféré. La liste des routines n’en prend pas : le bouton
 * Commencer le prend à l’ouverture, puis le relâche.
 */
export function claimsPreferredFocus(role: 'profile' | 'routine' | 'start' | 'empty', index: number): boolean {
  if (role === 'routine') return false;
  return index === 0;
}
