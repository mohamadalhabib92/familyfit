import { addDays, startOfWeek, todayISO } from './dates';
import type { Activity, Goal } from './model';
export function weekProgress(g: Goal, acts: Activity[], ref = todayISO()) {
  const from = startOfWeek(ref), to = addDays(from, 6);
  const done = acts.filter((a) => a.goalId === g.id && a.date >= from && a.date <= to).reduce((s, a) => s + a.amount, 0);
  return { done, pct: g.weeklyTarget > 0 ? Math.min(1, done / g.weeklyTarget) : 0 };
}
export function encouragement(pct: number) {
  if (pct >= 1) return 'Objectif atteint — bravo à toute la famille !';
  if (pct >= 0.6) return 'Très bonne semaine, on y est presque.';
  if (pct > 0) return 'Bien parti. Chaque petit pas compte.';
  return 'Nouvelle semaine, nouveau départ.';
}
