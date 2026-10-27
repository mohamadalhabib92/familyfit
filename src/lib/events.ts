import { addDays, fromISO, toMin } from './dates';
import type { FamilyEvent } from './model';

export type Occurrence = FamilyEvent & { day: string };

/** Le motif récurrent tombe-t-il ce jour-là ? (source unique pour l’agenda et les conflits) */
export function occursOn(e: FamilyEvent, day: string): boolean {
  if (day < e.date) return false;
  if (e.until && day > e.until) return false;
  if (e.recurrence === 'none') return day === e.date;
  if (e.recurrence === 'daily') return true;
  const a = fromISO(e.date), b = fromISO(day);
  if (e.recurrence === 'weekly') return a.getDay() === b.getDay();
  return a.getDate() === b.getDate();
}

export function occurrences(events: FamilyEvent[], from: string, days: number): Occurrence[] {
  const out: Occurrence[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    for (const e of events) if (occursOn(e, day)) out.push({ ...e, day });
  }
  return out.sort((x, y) => (x.day + (x.allDay ? '00:00' : x.start)).localeCompare(y.day + (y.allDay ? '00:00' : y.start)));
}

const sharesMember = (a: FamilyEvent, b: FamilyEvent) => !a.memberIds.length || !b.memberIds.length || a.memberIds.some((m) => b.memberIds.includes(m));
const overlaps = (a: FamilyEvent, b: FamilyEvent) => !a.allDay && !b.allDay && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

/** Conflit = même jour, créneaux qui se chevauchent, au moins un participant commun (ou « toute la famille »). */
export function conflictsFor(list: Occurrence[]): Map<string, string[]> {
  const res = new Map<string, string[]>();
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.day === b.day && overlaps(a, b) && sharesMember(a, b)) {
        const ka = `${a.id}@${a.day}`, kb = `${b.id}@${b.day}`;
        res.set(ka, [...(res.get(ka) ?? []), b.title]);
        res.set(kb, [...(res.get(kb) ?? []), a.title]);
      }
    }
  return res;
}

/** Conflits d’un brouillon d’événement avec l’existant sur les 60 prochains jours de sa série. */
export function draftConflicts(draft: FamilyEvent, others: FamilyEvent[], horizon = 60): string[] {
  const occ = occurrences([draft, ...others.filter((o) => o.id !== draft.id)], draft.date, draft.recurrence === 'none' ? 1 : horizon);
  const map = conflictsFor(occ);
  const hits = new Set<string>();
  for (const o of occ) if (o.id === draft.id) for (const t of map.get(`${o.id}@${o.day}`) ?? []) hits.add(t);
  return [...hits];
}
