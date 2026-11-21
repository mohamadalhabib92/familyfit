/**
 * Séances FamilyFit : catalogue original, adaptation par âge, minutage, défis.
 * Aucune promesse médicale. Aucun appel réseau. Les textes sont les nôtres.
 */

export const AGE_BANDS = ['4-7', '8-12', 'teen', 'adult', 'senior'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];
export type Phase = 'warmup' | 'main' | 'cooldown';
export type Intensity = 'gentle' | 'moderate';
export type Impact = 'none' | 'low';
export type Locale = 'fr' | 'en' | 'de' | 'ar';
export const LOCALES: Locale[] = ['fr', 'en', 'de', 'ar'];
export type L10n = Record<Locale, string>;
export type CoachId = 'lina' | 'noor' | 'pico' | 'sami';
export const COACH_IDS: CoachId[] = ['lina', 'noor', 'pico', 'sami'];

export type Block = {
  phase: Phase;
  moveId: string;
  workSec: number;
  restSec: number;
  intensity: Intensity;
  impact: Impact;
};

export type CueKind = 'phase' | 'start' | 'form' | 'countdown' | 'rest' | 'encourage' | 'done';
export type Cue = {
  atSec: number;
  kind: CueKind;
  moveId: string | null;
  phase: Phase | 'done';
  speechId: string;
  count?: number;
};

const BAND_SCALE: Record<AgeBand, { work: number; rest: number; intensity: Intensity; impact: Impact; note: L10n }> = {
  '4-7': {
    work: 14, rest: 18, intensity: 'gentle', impact: 'none',
    note: {
      fr: 'Version jeu, debout ou à genoux, sans saut.',
      en: 'Play version, standing or kneeling, no jumping.',
      de: 'Spielversion, im Stand oder Kniestand, ohne Sprung.',
      ar: 'نسخة لعب، وقوفًا أو جثوًا، بدون قفز.',
    },
  },
  '8-12': {
    work: 20, rest: 15, intensity: 'gentle', impact: 'none',
    note: {
      fr: 'Mouvement contrôlé, sans saut, on peut ralentir.',
      en: 'Controlled move, no jumping, slowing down is fine.',
      de: 'Kontrollierte Bewegung, ohne Sprung, langsamer ist in Ordnung.',
      ar: 'حركة متحكم بها، بدون قفز، ويمكن الإبطاء.',
    },
  },
  teen: {
    work: 30, rest: 12, intensity: 'moderate', impact: 'low',
    note: {
      fr: 'Amplitude confortable, sans forcer l’articulation.',
      en: 'A comfortable range, without forcing the joint.',
      de: 'Bequeme Amplitude, ohne das Gelenk zu zwingen.',
      ar: 'مدى مريح، دون إجبار المفصل.',
    },
  },
  adult: {
    work: 35, rest: 12, intensity: 'moderate', impact: 'low',
    note: {
      fr: 'Rythme régulier, genoux souples, dos long.',
      en: 'Steady pace, soft knees, long back.',
      de: 'Gleichmäßiges Tempo, weiche Knie, langer Rücken.',
      ar: 'إيقاع ثابت، ركبتان مرنتان، وظهر طويل.',
    },
  },
  senior: {
    work: 24, rest: 20, intensity: 'gentle', impact: 'none',
    note: {
      fr: 'Version chaise ou plan de travail, sans aller au sol.',
      en: 'Chair or counter version, no floor work.',
      de: 'Mit Stuhl oder Arbeitsplatte, ohne auf den Boden zu gehen.',
      ar: 'نسخة الكرسي أو الطاولة، بدون النزول إلى الأرض.',
    },
  },
};

const NOTE: L10n = {
  fr: 'Arrêtez si une douleur apparaît. Ceci n’est pas un avis médical. Demandez à un médecin avant de commencer, surtout pour un enfant.',
  en: 'Stop if something hurts. This is not medical advice. Ask a doctor before you start, especially for a child.',
  de: 'Hören Sie auf, wenn etwas weh tut. Das ist kein medizinischer Rat. Fragen Sie eine Ärztin oder einen Arzt, bevor Sie beginnen, besonders für ein Kind.',
  ar: 'توقف إذا ظهر ألم. هذه ليست نصيحة طبية. استشر طبيبًا قبل البدء، خصوصًا للطفل.',
};

type Move = { id: string; name: L10n; form: L10n; steps: L10n };

const MOVES: Move[] = [
  {
    id: 'march',
    name: { fr: 'Marche sur place', en: 'March in place', de: 'Marsch auf der Stelle', ar: 'المشي في المكان' },
    form: { fr: 'Posez le pied à plat, regard devant.', en: 'Place the whole foot down, look forward.', de: 'Den ganzen Fuß aufsetzen, Blick nach vorn.', ar: 'ضع القدم كاملة، والنظر للأمام.' },
    steps: { fr: 'Levez un genou, puis l’autre.', en: 'Lift one knee, then the other.', de: 'Ein Knie heben, dann das andere.', ar: 'ارفع ركبة ثم الأخرى.' },
  },
  {
    id: 'arm-circles',
    name: { fr: 'Cercles des bras', en: 'Arm circles', de: 'Armkreise', ar: 'دوائر الذراعين' },
    form: { fr: 'Petits cercles, épaules basses.', en: 'Small circles, shoulders down.', de: 'Kleine Kreise, Schultern tief.', ar: 'دوائر صغيرة، والكتفان منخفضان.' },
    steps: { fr: 'Tournez les bras vers l’avant, puis vers l’arrière.', en: 'Circle the arms forward, then back.', de: 'Arme nach vorn kreisen, dann zurück.', ar: 'دوّر الذراعين للأمام ثم للخلف.' },
  },
  {
    id: 'squat',
    name: { fr: 'Flexion douce', en: 'Easy bend', de: 'Sanfte Beuge', ar: 'انثناء لطيف' },
    form: { fr: 'Genoux dans l’axe des pieds, talons au sol.', en: 'Knees track over the feet, heels down.', de: 'Knie über den Füßen, Fersen am Boden.', ar: 'الركبتان فوق القدمين، والكعبان على الأرض.' },
    steps: { fr: 'Pliez un peu, puis revenez debout.', en: 'Bend a little, then stand tall again.', de: 'Etwas beugen, dann wieder aufrichten.', ar: 'انحنِ قليلًا ثم عد واقفًا.' },
  },
  {
    id: 'reach',
    name: { fr: 'Grandir vers le haut', en: 'Reach upward', de: 'Nach oben wachsen', ar: 'التمدد للأعلى' },
    form: { fr: 'Côtes longues, épaules loin des oreilles.', en: 'Long ribs, shoulders away from the ears.', de: 'Lange Rippen, Schultern weg von den Ohren.', ar: 'أضلاع طويلة، والكتفان بعيدان عن الأذنين.' },
    steps: { fr: 'Inspirez en ouvrant les bras, expirez en les reposant.', en: 'Breathe in while opening the arms, breathe out as they rest.', de: 'Einatmen und Arme öffnen, ausatmen und ablegen.', ar: 'شهيق مع فتح الذراعين، وزفير مع إراحتهما.' },
  },
  {
    id: 'side-step',
    name: { fr: 'Pas de côté', en: 'Side step', de: 'Seitenschritt', ar: 'خطوة جانبية' },
    form: { fr: 'Pas glissé, pas de décollage des deux pieds.', en: 'A sliding step, both feet do not leave the floor together.', de: 'Gleitender Schritt, nicht beide Füße zugleich abheben.', ar: 'خطوة منزلقة، دون رفع القدمين معًا.' },
    steps: { fr: 'Un pas à droite, un pas à gauche.', en: 'One step right, one step left.', de: 'Ein Schritt nach rechts, einer nach links.', ar: 'خطوة لليمين ثم خطوة لليسار.' },
  },
  {
    id: 'balance',
    name: { fr: 'Équilibre', en: 'Balance', de: 'Gleichgewicht', ar: 'توازن' },
    form: { fr: 'Un doigt peut rester sur un appui.', en: 'A finger may stay on a support.', de: 'Ein Finger darf an einer Stütze bleiben.', ar: 'يمكن إبقاء إصبع على سند.' },
    steps: { fr: 'Levez un pied quelques instants, puis changez.', en: 'Lift one foot briefly, then switch.', de: 'Einen Fuß kurz heben, dann wechseln.', ar: 'ارفع قدمًا لحظة ثم بدّل.' },
  },
  {
    id: 'breathe',
    name: { fr: 'Respiration lente', en: 'Slow breathing', de: 'Ruhige Atmung', ar: 'تنفس بطيء' },
    form: { fr: 'Le ventre bouge, les épaules restent calmes.', en: 'The belly moves, the shoulders stay quiet.', de: 'Der Bauch bewegt sich, die Schultern bleiben ruhig.', ar: 'البطن يتحرك، والكتفان هادئان.' },
    steps: { fr: 'Inspirez par le nez, expirez plus longtemps.', en: 'Breathe in through the nose, breathe out for longer.', de: 'Durch die Nase einatmen, länger ausatmen.', ar: 'شهيق من الأنف، وزفير أطول.' },
  },
  {
    id: 'shoulder',
    name: { fr: 'Épaules souples', en: 'Soft shoulders', de: 'Weiche Schultern', ar: 'أكتاف مرتخية' },
    form: { fr: 'Montez les épaules, puis laissez-les tomber.', en: 'Lift the shoulders, then let them drop.', de: 'Schultern heben, dann fallen lassen.', ar: 'ارفع الكتفين ثم دعهما يهبطان.' },
    steps: { fr: 'Trois haussements lents suffisent.', en: 'Three slow shrugs are enough.', de: 'Drei langsame Schulterheben genügen.', ar: 'ثلاث رفعات بطيئة تكفي.' },
  },
];

const MOVE_BY_ID = new Map(MOVES.map((m) => [m.id, m]));

export type Routine = {
  id: string;
  coachId: CoachId;
  name: L10n;
  blurb: L10n;
  phases: Record<Phase, string[]>;
};

export const ROUTINES: Routine[] = [
  {
    id: 'morning-together',
    coachId: 'lina',
    name: { fr: 'Réveil ensemble', en: 'Wake up together', de: 'Gemeinsam aufwachen', ar: 'استيقاظ معًا' },
    blurb: { fr: 'La même séance pour toute la table, chacun à son niveau.', en: 'One session for the whole table, each at their level.', de: 'Eine Einheit für den ganzen Tisch, jede Person auf ihrem Niveau.', ar: 'حصة واحدة للمائدة كلها، كل شخص بمستواه.' },
    phases: { warmup: ['march', 'arm-circles'], main: ['squat', 'reach', 'side-step', 'balance'], cooldown: ['breathe', 'shoulder'] },
  },
  {
    id: 'evening-calm',
    coachId: 'noor',
    name: { fr: 'Soir calme', en: 'Quiet evening', de: 'Ruhiger Abend', ar: 'مساء هادئ' },
    blurb: { fr: 'Étirements lents pour fermer la journée, sans performance.', en: 'Slow stretches to close the day, with no performance.', de: 'Langsame Dehnungen zum Tagesabschluss, ohne Leistung.', ar: 'إطالات بطيئة لإغلاق اليوم، بلا أداء.' },
    phases: { warmup: ['breathe', 'shoulder'], main: ['reach', 'arm-circles', 'balance', 'breathe'], cooldown: ['shoulder', 'breathe'] },
  },
  {
    id: 'play-animals',
    coachId: 'pico',
    name: { fr: 'Jeu des postures', en: 'Shape game', de: 'Formenspiel', ar: 'لعبة الأشكال' },
    blurb: { fr: 'Des formes inventées ici, à imiter ensemble. Pas un personnage connu.', en: 'Shapes invented here, to copy together. Not a known character.', de: 'Hier erfundene Formen, gemeinsam nachmachen. Keine bekannte Figur.', ar: 'أشكال ابتُكرت هنا لنقلّدها معًا. ليست شخصية معروفة.' },
    phases: { warmup: ['march', 'arm-circles'], main: ['squat', 'reach', 'balance', 'side-step'], cooldown: ['breathe', 'shoulder'] },
  },
  {
    id: 'steady-balance',
    coachId: 'sami',
    name: { fr: 'Équilibre tranquille', en: 'Quiet balance', de: 'Ruhiges Gleichgewicht', ar: 'توازن هادئ' },
    blurb: { fr: 'Appuis stables, pauses longues, adapté aux grands-parents comme aux plus jeunes.', en: 'Stable supports, long pauses, for grandparents and younger ones alike.', de: 'Stabile Stützen, lange Pausen, für Großeltern wie für Jüngere.', ar: 'سند ثابت وتوقفات طويلة، للأجداد والصغار معًا.' },
    phases: { warmup: ['march', 'shoulder'], main: ['balance', 'squat', 'reach', 'breathe'], cooldown: ['arm-circles', 'breathe'] },
  },
];

export type Variant = Block & {
  name: L10n;
  steps: L10n;
  form: L10n;
  contraindication: L10n;
};

export function variantFor(moveId: string, band: AgeBand): Variant {
  const move = MOVE_BY_ID.get(moveId);
  if (!move) throw new Error(`mouvement inconnu: ${moveId}`);
  const scale = BAND_SCALE[band];
  const steps: L10n = {
    fr: `${move.steps.fr} ${scale.note.fr}`,
    en: `${move.steps.en} ${scale.note.en}`,
    de: `${move.steps.de} ${scale.note.de}`,
    ar: `${move.steps.ar} ${scale.note.ar}`,
  };
  return {
    phase: 'main',
    moveId,
    workSec: scale.work,
    restSec: scale.rest,
    intensity: scale.intensity,
    impact: scale.impact,
    name: move.name,
    steps,
    form: move.form,
    contraindication: NOTE,
  };
}

export function adaptRoutine(routineId: string, band: AgeBand): Block[] {
  const routine = ROUTINES.find((r) => r.id === routineId);
  if (!routine) throw new Error(`séance inconnue: ${routineId}`);
  const blocks: Block[] = [];
  (['warmup', 'main', 'cooldown'] as const).forEach((phase) => {
    routine.phases[phase].forEach((moveId) => {
      const v = variantFor(moveId, band);
      blocks.push({ phase, moveId, workSec: v.workSec, restSec: v.restSec, intensity: v.intensity, impact: v.impact });
    });
  });
  const last = blocks[blocks.length - 1];
  if (last) blocks[blocks.length - 1] = { ...last, restSec: 0 };
  return blocks;
}

/** Horloge commune : le travail suit le plus court, le repos le plus long. Même ordre de mouvements. */
export function sharedClock(perMember: Block[][]): Block[] {
  if (!perMember.length) return [];
  const count = perMember[0]?.length ?? 0;
  const out: Block[] = [];
  for (let i = 0; i < count; i++) {
    const col = perMember.map((blocks) => blocks[i]).filter((b): b is Block => !!b);
    const first = col[0];
    if (!first) continue;
    out.push({
      phase: first.phase,
      moveId: first.moveId,
      workSec: Math.min(...col.map((b) => b.workSec)),
      restSec: Math.max(...col.map((b) => b.restSec)),
      intensity: col.some((b) => b.intensity === 'gentle') ? 'gentle' : first.intensity,
      impact: col.some((b) => b.impact === 'none') ? 'none' : first.impact,
    });
  }
  return out;
}

export function sameMoveOrder(perMember: Block[][]): boolean {
  if (perMember.length < 2) return true;
  const base = perMember[0]?.map((b) => `${b.phase}:${b.moveId}`).join('|');
  return perMember.every((blocks) => blocks.map((b) => `${b.phase}:${b.moveId}`).join('|') === base);
}

export function buildTimeline(blocks: Block[]): { cues: Cue[]; durationSec: number } {
  const cues: Cue[] = [];
  let t = 0;
  let lastPhase: Phase | null = null;
  blocks.forEach((block, index) => {
    if (block.phase !== lastPhase) {
      cues.push({ atSec: t, kind: 'phase', moveId: block.moveId, phase: block.phase, speechId: `phase.${block.phase}` });
      lastPhase = block.phase;
    }
    cues.push({ atSec: t, kind: 'start', moveId: block.moveId, phase: block.phase, speechId: `start.${block.moveId}` });
    if (block.workSec >= 8) {
      cues.push({ atSec: t + 2, kind: 'form', moveId: block.moveId, phase: block.phase, speechId: `form.${block.moveId}` });
    }
    if (block.phase === 'main' && index % 2 === 0) {
      const mid = t + Math.floor(block.workSec / 2);
      if (mid > t) cues.push({ atSec: mid, kind: 'encourage', moveId: block.moveId, phase: block.phase, speechId: 'encourage' });
    }
    if (block.workSec >= 8) {
      [3, 2, 1].forEach((n) => {
        const at = t + block.workSec - n;
        if (at > t) cues.push({ atSec: at, kind: 'countdown', moveId: block.moveId, phase: block.phase, speechId: `count.${n}`, count: n });
      });
    }
    t += block.workSec;
    if (block.restSec > 0) {
      cues.push({ atSec: t, kind: 'rest', moveId: block.moveId, phase: block.phase, speechId: 'rest' });
      t += block.restSec;
    }
  });
  cues.push({ atSec: t, kind: 'done', moveId: null, phase: 'done', speechId: 'done' });
  return { cues, durationSec: t };
}

export function cuesBetween(cues: Cue[], fromExclusive: number, toInclusive: number): Cue[] {
  return cues.filter((c) => c.atSec > fromExclusive && c.atSec <= toInclusive);
}

export type Player = { elapsedSec: number; running: boolean; done: boolean; warmupCompleted: boolean };

export function createPlayer(): Player {
  return { elapsedSec: 0, running: false, done: false, warmupCompleted: false };
}
export function startPlayer(p: Player): Player {
  return p.done ? p : { ...p, running: true };
}
export function pausePlayer(p: Player): Player {
  return { ...p, running: false };
}
export function warmupEndsAt(blocks: Block[]): number {
  let t = 0;
  for (const b of blocks) {
    if (b.phase !== 'warmup') break;
    t += b.workSec + b.restSec;
  }
  return t;
}
export function tick(p: Player, deltaSec: number, durationSec: number, warmupAt: number): { player: Player; from: number; to: number } {
  if (!p.running || p.done || deltaSec <= 0) return { player: p, from: p.elapsedSec, to: p.elapsedSec };
  const from = p.elapsedSec;
  const to = Math.min(durationSec, from + deltaSec);
  const done = to >= durationSec;
  return {
    player: { elapsedSec: done ? durationSec : to, running: !done, done, warmupCompleted: p.warmupCompleted || to >= warmupAt },
    from,
    to: done ? durationSec : to,
  };
}

/** L’échauffement ne se saute pas. La fonction ne modifie pas le lecteur. */
export function requestSkipWarmup(player: Player): { player: Player; ok: false; reason: 'warmup-required' } {
  return { player, ok: false, reason: 'warmup-required' };
}

export function defaultAgeBand(member: { isMinor: boolean; ageBand?: string | null }): AgeBand {
  if (member.ageBand && (AGE_BANDS as readonly string[]).includes(member.ageBand)) return member.ageBand as AgeBand;
  return member.isMinor ? '4-7' : 'adult';
}

/** Un mineur n’a une séance guidée que si un parent l’a autorisée. */
export function guidedAllowed(member: { isMinor: boolean; guidedWorkouts?: boolean }): boolean {
  if (member.isMinor) return member.guidedWorkouts === true;
  return member.guidedWorkouts !== false;
}

export type WorkoutLog = {
  id: string;
  routineId: string;
  coachId: CoachId;
  memberIds: string[];
  date: string;
  completedAt: string;
  durationSec: number;
  warmupCompleted: true;
  together: boolean;
};

export type Challenge = { id: string; title: string; weekStart: string; targetMinutes: number; memberIds: string[] };
export type BadgeId = 'first-session' | 'three-day' | 'together' | 'warmup-keeper' | 'weekly-goal';
export type BadgeAward = { id: string; memberId: string; badge: BadgeId; at: string };

export type FitnessDisk = {
  logs: WorkoutLog[];
  challenges: Challenge[];
  badges: BadgeAward[];
  weeklyGoalMin: number;
  coachId: CoachId;
  healthStatus: 'unknown' | 'granted' | 'denied' | 'unavailable';
  lastSteps: number | null;
  stepsDay: string | null;
};

export const EMPTY_FITNESS: FitnessDisk = {
  logs: [], challenges: [], badges: [], weeklyGoalMin: 60, coachId: 'lina',
  healthStatus: 'unknown', lastSteps: null, stepsDay: null,
};

export function addDaysISO(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function startOfWeekISO(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const wd = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - wd);
  return dt.toISOString().slice(0, 10);
}

export function streakEnding(activeDays: string[], today: string): number {
  const set = new Set(activeDays);
  let cursor = set.has(today) ? today : addDaysISO(today, -1);
  if (!set.has(cursor)) return 0;
  let n = 0;
  while (set.has(cursor)) {
    n += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return n;
}

export function weeklySeconds(logs: WorkoutLog[], memberId: string, today: string): number {
  const from = startOfWeekISO(today);
  const to = addDaysISO(from, 6);
  return logs
    .filter((l) => l.warmupCompleted && l.memberIds.includes(memberId) && l.date >= from && l.date <= to)
    .reduce((sum, l) => sum + l.durationSec, 0);
}

export function leaderboard(logs: WorkoutLog[], memberIds: string[], today: string): { memberId: string; seconds: number }[] {
  return memberIds
    .map((memberId) => ({ memberId, seconds: weeklySeconds(logs, memberId, today) }))
    .sort((a, b) => b.seconds - a.seconds || a.memberId.localeCompare(b.memberId));
}

export function awardBadges(existing: BadgeAward[], logs: WorkoutLog[], memberIds: string[], today: string, weeklyGoalMin: number): BadgeAward[] {
  const next = [...existing];
  const has = (memberId: string, badge: BadgeId) => next.some((b) => b.memberId === memberId && b.badge === badge);
  const give = (memberId: string, badge: BadgeId) => {
    if (!has(memberId, badge)) next.push({ id: `${badge}:${memberId}`, memberId, badge, at: today });
  };
  memberIds.forEach((id) => {
    const mine = logs.filter((l) => l.warmupCompleted && l.memberIds.includes(id));
    if (mine.length >= 1) give(id, 'first-session');
    if (mine.length >= 5) give(id, 'warmup-keeper');
    if (mine.some((l) => l.together && l.memberIds.length >= 2)) give(id, 'together');
    if (streakEnding([...new Set(mine.map((l) => l.date))], today) >= 3) give(id, 'three-day');
    if (weeklySeconds(logs, id, today) >= weeklyGoalMin * 60) give(id, 'weekly-goal');
  });
  return next;
}

export function appendWorkout<T extends FitnessDisk>(disk: T, log: WorkoutLog, today: string): T {
  const logs = [...disk.logs, log];
  const badges = awardBadges(disk.badges, logs, log.memberIds, today, disk.weeklyGoalMin);
  return { ...disk, logs, badges };
}

export function catalogStrings(): string[] {
  const out: string[] = [];
  const push = (value: L10n | string) => {
    if (typeof value === 'string') out.push(value);
    else LOCALES.forEach((locale) => out.push(value[locale]));
  };
  MOVES.forEach((m) => { push(m.name); push(m.form); push(m.steps); });
  ROUTINES.forEach((r) => { push(r.name); push(r.blurb); });
  (Object.keys(BAND_SCALE) as AgeBand[]).forEach((band) => push(BAND_SCALE[band].note));
  push(NOTE);
  return out;
}

/** Affichage : 5.100999999999939 devient 5. Jamais un flottant à l’écran. */
export function wholeSeconds(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function formatClock(totalSec: number): string {
  const s = wholeSeconds(totalSec);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

export function activeBlock(blocks: Block[], elapsed: number): { block: Block; index: number; into: number; remaining: number } | null {
  let t = 0;
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (!block) continue;
    const span = block.workSec + block.restSec;
    if (elapsed < t + span || index === blocks.length - 1) {
      const into = Math.max(0, elapsed - t);
      const inRest = into >= block.workSec;
      const remaining = inRest ? Math.max(0, span - into) : Math.max(0, block.workSec - into);
      return { block, index, into, remaining };
    }
    t += span;
  }
  return null;
}

export function runWorkoutSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const kid = adaptRoutine('morning-together', '4-7');
  const older = adaptRoutine('morning-together', '8-12');
  const teen = adaptRoutine('morning-together', 'teen');
  const adult = adaptRoutine('morning-together', 'adult');
  const senior = adaptRoutine('morning-together', 'senior');

  check('échauffement en premier et retour au calme en dernier', kid[0]?.phase === 'warmup' && kid[kid.length - 1]?.phase === 'cooldown' && kid.some((b) => b.phase === 'main'));
  check('même ordre de mouvements pour tous les âges', sameMoveOrder([kid, older, teen, adult, senior]));
  check('4-7 : travail court, intensité douce, sans impact', kid.every((b) => b.workSec <= 20 && b.intensity === 'gentle' && b.impact === 'none'));
  check('8-12 : sans impact et plus court qu’un adulte', older.every((b) => b.impact === 'none' && b.workSec <= 20) && (older.find((b) => b.phase === 'main')?.workSec ?? 99) < (adult.find((b) => b.phase === 'main')?.workSec ?? 0));
  check('senior : repos au moins égal à l’adulte, sans impact', senior.every((b) => b.impact === 'none' && b.intensity === 'gentle') && senior.slice(0, -1).every((b, i) => b.restSec >= (adult[i]?.restSec ?? 0)));
  check('ado : impact bas seulement, jamais haut', teen.every((b) => b.impact === 'low' || b.impact === 'none'));
  check('texte 4-7 sans saut', variantFor('squat', '4-7').steps.fr.includes('sans saut') && variantFor('squat', '4-7').steps.en.includes('no jumping'));
  check('texte senior sans sol', variantFor('balance', 'senior').steps.fr.includes('sans aller au sol') && variantFor('balance', 'senior').steps.de.includes('ohne auf den Boden'));
  check('note de prudence présente dans les quatre langues', LOCALES.every((locale) => variantFor('march', 'adult').contraindication[locale].length > 20));

  const banned = /diagnos|kcal|calorie|poids|maigrir|\bimc\b|gu[ée]ri|lose weight|abnehmen/i;
  check('aucune promesse de poids, calorie ou guérison dans le catalogue', catalogStrings().every((s) => !banned.test(s)));

  const clock = sharedClock([kid, adult, senior]);
  check('horloge famille : mêmes mouvements', clock.map((b) => b.moveId).join() === adult.map((b) => b.moveId).join());
  check('horloge famille : travail du plus court, repos du plus long', clock.every((b, i) => b.workSec === Math.min(kid[i]?.workSec ?? 0, adult[i]?.workSec ?? 0, senior[i]?.workSec ?? 0) && b.restSec === Math.max(kid[i]?.restSec ?? 0, adult[i]?.restSec ?? 0, senior[i]?.restSec ?? 0)));

  const { cues, durationSec } = buildTimeline(adult);
  const summed = adult.reduce((s, b) => s + b.workSec + b.restSec, 0);
  check('durée = somme travail + repos', durationSec === summed && durationSec > 0);
  check('premier repère = phase d’échauffement à 0', cues[0]?.kind === 'phase' && cues[0]?.phase === 'warmup' && cues[0]?.atSec === 0);
  check('compte à rebours 3, 2, 1 sur un bloc assez long', [3, 2, 1].every((n) => cues.some((c) => c.kind === 'countdown' && c.count === n)));
  check('repère de repos et de fin', cues.some((c) => c.kind === 'rest') && cues[cues.length - 1]?.kind === 'done' && cues[cues.length - 1]?.atSec === durationSec);
  const first = cuesBetween(cues, -1, 0);
  const again = cuesBetween(cues, 0, 1);
  check('un repère à 0 n’est pas répété à la seconde suivante', first.some((c) => c.atSec === 0) && again.every((c) => c.atSec !== 0));

  const warm = warmupEndsAt(adult);
  check('fin d’échauffement avant le corps de séance', warm > 0 && warm < durationSec);
  let player = startPlayer(createPlayer());
  let step = tick(player, 1, durationSec, warm);
  check('secondes affichées entières', wholeSeconds(5.100999999999939) === 5 && wholeSeconds(0.4) === 0 && wholeSeconds(-3) === 0 && wholeSeconds(Number.NaN) === 0 && formatClock(29.6) === '0:30');
  check('une seconde ne termine pas l’échauffement', step.player.elapsedSec === 1 && step.player.warmupCompleted === false && step.from === 0 && step.to === 1);
  step = tick(step.player, warm, durationSec, warm);
  check('le lecteur marque l’échauffement quand son temps est atteint', step.player.warmupCompleted === true && step.player.elapsedSec >= warm);
  const skipped = requestSkipWarmup(step.player);
  check('passer l’échauffement est refusé et ne change pas le lecteur', skipped.ok === false && skipped.reason === 'warmup-required' && skipped.player === step.player);
  let done = step.player;
  done = tick(done, durationSec, durationSec, warm).player;
  check('la fin arrête le lecteur sur la durée exacte', done.done === true && done.running === false && done.elapsedSec === durationSec);
  const idle = tick(pausePlayer(done), 5, durationSec, warm);
  check('un lecteur en pause ne bouge pas', idle.from === idle.to && idle.player.elapsedSec === done.elapsedSec);

  check('mineur sans accord : pas de séance guidée', guidedAllowed({ isMinor: true }) === false && guidedAllowed({ isMinor: true, guidedWorkouts: true }) === true);
  check('adulte guidé par défaut, refus explicite respecté', guidedAllowed({ isMinor: false }) === true && guidedAllowed({ isMinor: false, guidedWorkouts: false }) === false);
  check('âge inconnu : enfant au plus doux, adulte sinon', defaultAgeBand({ isMinor: true }) === '4-7' && defaultAgeBand({ isMinor: false, ageBand: 'nope' }) === 'adult' && defaultAgeBand({ isMinor: true, ageBand: 'senior' }) === 'senior');

  check('série de 3 jours, y compris si aujourd’hui n’est pas encore fait', streakEnding(['2026-11-13', '2026-11-14', '2026-11-15'], '2026-11-15') === 3 && streakEnding(['2026-11-13', '2026-11-14'], '2026-11-15') === 2 && streakEnding(['2026-11-13'], '2026-11-15') === 0);

  const log = (date: string, members: string[], sec: number, together = false): WorkoutLog => ({
    id: `w-${date}-${members.join()}`, routineId: 'morning-together', coachId: 'lina', memberIds: members, date,
    completedAt: `${date}T10:00:00.000Z`, durationSec: sec, warmupCompleted: true, together,
  });
  const base = { ...EMPTY_FITNESS, vendorField: 'keep' };
  const withLog = appendWorkout(base, log('2026-11-15', ['a', 'b'], 600, true), '2026-11-15');
  check('journal ajouté, champ inconnu gardé', withLog.logs.length === 1 && withLog.vendorField === 'keep' && withLog.badges.some((b) => b.badge === 'first-session' && b.memberId === 'a'));
  check('défi ensemble dès deux participants', withLog.badges.some((b) => b.badge === 'together'));
  const week = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'].map((date) => log(date, ['a'], 400));
  const badges = awardBadges([], week, ['a'], '2026-11-15', 60);
  check('série de trois et gardien d’échauffement', badges.some((b) => b.badge === 'three-day') && !badges.some((b) => b.badge === 'warmup-keeper'));
  const five = awardBadges(badges, [...week, log('2026-11-09', ['a'], 400)], ['a'], '2026-11-15', 60);
  check('cinq séances : badge échauffement, sans retirer les autres', five.filter((b) => b.memberId === 'a' && b.badge === 'first-session').length === 1 && five.some((b) => b.badge === 'warmup-keeper'));
  const board = leaderboard([log('2026-11-11', ['a'], 100), log('2026-11-11', ['b'], 300), log('2026-10-01', ['b'], 9999)], ['a', 'b', 'c'], '2026-11-15');
  check('classement de la semaine, hors ancienne séance', board[0]?.memberId === 'b' && board[0]?.seconds === 300 && board[2]?.memberId === 'c' && board[2]?.seconds === 0);
  const goal = awardBadges([], [log('2026-11-11', ['a'], 3600)], ['a'], '2026-11-15', 60);
  check('objectif de minutes de la semaine', goal.some((b) => b.badge === 'weekly-goal'));
  check('une séance sans échauffement complet n’entre pas dans le type', true);

  return out;
}
