/**
 * Séance du jour, visible sans compte.
 * Les coachs et les mouvements sont dans le bundle : rien ici n’écrit le disque,
 * et aucune clé @familyfit/ n’est ajoutée.
 */
import { EXERCISES, resolveDemo, ROSTER_IDS, type RosterCoachId } from './coachLibrary';
import {
  COOLDOWN_TIMING, PHASE_TIMING,
  type SessionAudience, type SessionLevel, type SessionMinutes,
} from './progression';
import { addDaysISO, startOfWeekISO, streakEnding, type WorkoutLog } from './workoutEngine';

/** Lina et Noor d’abord : les deux coachs illustrés déjà là. Pico et Sami restent. */
export const ILLUSTRATED_IDS = ['lina', 'noor', 'pico', 'sami'] as const;
export const KEPT_PAIR = ['lina', 'noor'] as const;

export type TodayPlan = {
  audience: SessionAudience;
  minutes: SessionMinutes;
  level: SessionLevel;
  /** Week-end : Moussa et Élias, pic plus doux. */
  kids: boolean;
};

export type PlayParams = {
  minutes: string;
  level: SessionLevel;
  audience: SessionAudience;
  coach: RosterCoachId;
};

export const KIDS_PLAY: PlayParams = {
  minutes: '15',
  level: 'debutant',
  audience: 'famille',
  coach: 'coach-papa-garcon',
};

function weekday(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1)).getUTCDay();
}

/** Une séance concrète chaque jour. Samedi et dimanche : les enfants. */
export function todayPlan(isoDate: string): TodayPlan {
  const day = weekday(isoDate);
  if (day === 0 || day === 6) return { audience: 'famille', minutes: 15, level: 'debutant', kids: true };
  if (day === 2 || day === 4) return { audience: 'adulte', minutes: 20, level: 'intermediaire', kids: false };
  return { audience: 'adulte', minutes: 15, level: 'intermediaire', kids: false };
}

export function todayPlayParams(plan: TodayPlan): PlayParams {
  if (plan.kids) return { ...KIDS_PLAY };
  return {
    minutes: String(plan.minutes),
    level: plan.level,
    audience: plan.audience,
    coach: 'coach-homme',
  };
}

/** Travail / repos de chaque temps, pour l’afficher avant de lancer. */
export function timingCaption(plan: TodayPlan): string {
  const timing = PHASE_TIMING[plan.audience][plan.level];
  const cool = COOLDOWN_TIMING[plan.audience];
  const bit = (work: number, rest: number) => `${work} s / ${rest} s`;
  return `${bit(timing.echauffement.work, timing.echauffement.rest)} · ${bit(timing.montee.work, timing.montee.rest)} · ${bit(timing.intense.work, timing.intense.rest)} · ${bit(cool.work, cool.rest)}`;
}

type PracticeLog = Pick<WorkoutLog, 'warmupCompleted' | 'date' | 'durationSec'>;

/** Minutes de la semaine, y compris une séance solo sans fiche membre. */
export function practiceWeekSeconds(logs: PracticeLog[] | null | undefined, today: string): number {
  const from = startOfWeekISO(today);
  const to = addDaysISO(from, 6);
  return (logs ?? [])
    .filter((log) => log.warmupCompleted && log.date >= from && log.date <= to)
    .reduce((sum, log) => sum + log.durationSec, 0);
}

export function practiceStreak(logs: Pick<WorkoutLog, 'warmupCompleted' | 'date'>[] | null | undefined, today: string): number {
  const days = [...new Set((logs ?? []).filter((log) => log.warmupCompleted).map((log) => log.date))];
  return streakEnding(days, today);
}

/** Vidéo du coach, sinon les étapes sur sa photo. Jamais un mouvement sans visuel. */
export function everyMoveHasFallback(): boolean {
  return EXERCISES.every((exercise) => {
    const demo = resolveDemo(exercise, exercise.coachId);
    if (demo.kind === 'video') return Boolean(demo.asset || demo.url);
    return demo.steps.length >= 3;
  });
}

export function runHomePracticeSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const saturday = todayPlan('2026-11-21');
  const monday = todayPlan('2026-11-23');
  const tuesday = todayPlan('2026-11-24');
  check('samedi : Moussa et Élias', saturday.kids && saturday.audience === 'famille' && todayPlayParams(saturday).coach === 'coach-papa-garcon');
  check('lundi : adulte 15 min', !monday.kids && monday.minutes === 15 && monday.audience === 'adulte' && todayPlayParams(monday).coach === 'coach-homme');
  check('mardi : adulte 20 min', tuesday.minutes === 20 && tuesday.level === 'intermediaire');
  check('légende des temps', timingCaption(monday).includes('20 s / 20 s') && timingCaption(monday).includes('40 s / 10 s'));
  check('semaine vide', practiceWeekSeconds(undefined, '2026-11-21') === 0 && practiceStreak(null, '2026-11-21') === 0);
  const solo = [{ warmupCompleted: true as const, date: '2026-11-21', durationSec: 600, memberIds: [] as string[] }];
  check('séance sans fiche comptée', practiceWeekSeconds(solo, '2026-11-21') === 600 && practiceStreak(solo, '2026-11-21') === 1);
  check('Lina et Noor en tête, sept coachs filmés', ILLUSTRATED_IDS[0] === 'lina' && ILLUSTRATED_IDS[1] === 'noor' && KEPT_PAIR.length === 2 && ROSTER_IDS.length === 7 && ROSTER_IDS.includes('coach-afrique-ouest') && ROSTER_IDS.includes('coach-papa-garcon'));
  check('chaque mouvement a une vidéo ou des étapes', everyMoveHasFallback());
  return out;
}
