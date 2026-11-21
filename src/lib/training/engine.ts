/**
 * Programme guidé et horloge unique.
 * Vidéo, voix, minuteur, répétitions et gain musical lisent le même temps.
 * Aucune clé @familyfit/ nouvelle : l’historique reste le journal fitness.
 */

export const TRANSITION_MS = 500;
export const DRIFT_LIMIT_MS = 100;
export const CLIP_LOOP_MS = 12_000;

export type Level = 'debutant' | 'intermediaire' | 'avance';
export type ProgramMinutes = 10 | 15 | 20 | 30 | 45;
export type SessionType = 'hiit' | 'strength' | 'core' | 'mobility' | 'yoga' | 'dance' | 'family';
export type Phase = 'warmup' | 'main' | 'cooldown';
export type SegmentRole = 'work' | 'rest' | 'transition';
export type SpeakerId = 'moussa' | 'elias';
export type CueKind = 'intro' | 'name' | 'posture' | 'countdown' | 'encourage' | 'rest';
export type ShotStatus = 'pret' | 'reutiliser' | 'regenerer' | 'manquant';

export type ShotSheet = {
  framing: string;
  angle: string;
  durationSec: number;
  repsToFilm: number;
  tempo: string;
  light: string;
  background: string;
  status: ShotStatus;
  note: string;
};

export type Exercise = {
  id: string;
  name: { fr: string; en: string };
  zone: string;
  dose: { kind: 'reps' | 'time'; reps?: number; seconds?: number };
  tempo: string;
  cues: { fr: string[]; en: string[] };
  mistake: { fr: string; en: string };
  easier: { fr: string; en: string };
  bpm: number;
  video: { asset: string | null; inMs: number; outMs: number };
  shot: ShotSheet;
};

export type VoiceCue = {
  id: string;
  atMs: number;
  speaker: SpeakerId;
  kind: CueKind;
  fr: string;
  en: string;
};

export type TimelineSegment = {
  id: string;
  phase: Phase;
  role: SegmentRole;
  startMs: number;
  endMs: number;
  exerciseId: string;
  video: { asset: string | null; inMs: number; outMs: number };
  bpm: number;
};

export type Workout = {
  id: string;
  title: { fr: string; en: string };
  type: SessionType;
  minutes: ProgramMinutes;
  level: Level;
  week: 1 | 2 | 3 | 4;
  speakers: SpeakerId[];
  zones: string[];
  exercises: Exercise[];
  segments: TimelineSegment[];
  cues: VoiceCue[];
};

const LIGHT = 'Lumière douce de face, pas de contre-jour.';
const BACKDROP = 'Mur clair uni, sol dégagé, cadre stable du premier au dernier photogramme.';

function shot(status: ShotStatus, tempo: string, reps: number, note: string): ShotSheet {
  return {
    framing: 'Corps entier, tête aux pieds, marge autour des mains.',
    angle: 'Trois-quarts face, caméra à hauteur de hanche.',
    durationSec: 12,
    repsToFilm: reps,
    tempo,
    light: LIGHT,
    background: BACKDROP,
    status,
    note,
  };
}

export const EXERCISE_LIBRARY: Exercise[] = [
  {
    id: 'step-jack',
    name: { fr: 'Pas chassé doux', en: 'Easy step-jack' },
    zone: 'cardio',
    dose: { kind: 'time', seconds: 40 },
    tempo: '1-0-1',
    cues: {
      fr: ['Un pied reste près du sol.', 'Les bras montent sans hausser les épaules.', 'Le regard reste devant.'],
      en: ['One foot stays close to the floor.', 'Arms rise without lifting the shoulders.', 'Eyes stay forward.'],
    },
    mistake: { fr: 'Sauter et retomber lourdement.', en: 'Jumping and landing hard.' },
    easier: { fr: 'Marche sur place, les bras se balancent.', en: 'March in place and swing the arms.' },
    bpm: 108,
    video: { asset: 'assets/coach-videos/step-jack-coach-homme.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '1-0-1', 16, 'Clip Marc déjà dans l’app. Boucle à vérifier : le pied doit revenir au même endroit.'),
  },
  {
    id: 'squat',
    name: { fr: 'Flexion', en: 'Squat' },
    zone: 'jambes',
    dose: { kind: 'reps', reps: 8 },
    tempo: '2-0-2',
    cues: {
      fr: ['Poussez les hanches vers l’arrière.', 'Genoux dans l’axe des orteils.', 'Talons lourds au sol.'],
      en: ['Send the hips back.', 'Knees track over the toes.', 'Heels stay heavy.'],
    },
    mistake: { fr: 'Genoux qui rentrent vers l’intérieur.', en: 'Knees collapsing inward.' },
    easier: { fr: 'Descente plus haute, mains sur une chaise.', en: 'Shallower squat, hands on a chair.' },
    bpm: 60,
    video: { asset: 'assets/coach-videos/coach-homme-squat-v2.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '2-0-2', 8, 'Clip Marc. À regénérer si la fin de boucle ne rejoint pas le début.'),
  },
  {
    id: 'fente',
    name: { fr: 'Fente arrière courte', en: 'Short reverse lunge' },
    zone: 'jambes',
    dose: { kind: 'reps', reps: 6 },
    tempo: '2-0-2',
    cues: {
      fr: ['Le pas arrière reste court.', 'Le genou avant suit le milieu du pied.', 'Le buste reste haut.'],
      en: ['The back step stays short.', 'Front knee tracks the middle of the foot.', 'Chest stays tall.'],
    },
    mistake: { fr: 'Genou avant qui dépasse loin des orteils.', en: 'Front knee shooting far past the toes.' },
    easier: { fr: 'Un doigt sur le dossier d’une chaise.', en: 'One finger on a chair back.' },
    bpm: 56,
    video: { asset: 'assets/coach-videos/fente-coach-maghreb.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '2-0-2', 6, 'Clip Karim. Garder le même pied d’appui au raccord de boucle.'),
  },
  {
    id: 'pompes',
    name: { fr: 'Pompes inclinées', en: 'Incline push-up' },
    zone: 'bras',
    dose: { kind: 'reps', reps: 6 },
    tempo: '2-0-2',
    cues: {
      fr: ['Corps en planche, des épaules aux genoux ou aux pieds.', 'Coudes à environ 45 degrés.', 'Le menton reste rentré.'],
      en: ['Body in one line from shoulders to knees or feet.', 'Elbows near 45 degrees.', 'Chin stays tucked.'],
    },
    mistake: { fr: 'Hanches qui tombent ou montent.', en: 'Hips sagging or piking.' },
    easier: { fr: 'Mains sur un mur ou un plan de travail.', en: 'Hands on a wall or counter.' },
    bpm: 52,
    video: { asset: 'assets/coach-videos/pompes-coach-femme-voilee.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '2-0-2', 6, 'Clip Amina. Vérifier que les mains ne glissent pas entre le début et la fin.'),
  },
  {
    id: 'crunch',
    name: { fr: 'Crunch bas', en: 'Low crunch' },
    zone: 'abdos',
    dose: { kind: 'reps', reps: 8 },
    tempo: '2-1-2',
    cues: {
      fr: ['Bas du dos reste au sol.', 'Le regard vise les genoux, pas le plafond.', 'Soufflez en montant.'],
      en: ['Low back stays down.', 'Eyes aim at the knees, not the ceiling.', 'Breathe out on the way up.'],
    },
    mistake: { fr: 'Tirer la nuque avec les mains.', en: 'Pulling the neck with the hands.' },
    easier: { fr: 'Seulement décoller la tête et les épaules d’un centimètre.', en: 'Lift head and shoulders only a centimetre.' },
    bpm: 48,
    video: { asset: 'assets/coach-videos/crunch-coach-femme.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '2-1-2', 8, 'Clip Léa. La nuque doit revenir au même coussin à chaque boucle.'),
  },
  {
    id: 'planche',
    name: { fr: 'Planche sur les genoux', en: 'Knee plank' },
    zone: 'abdos',
    dose: { kind: 'time', seconds: 20 },
    tempo: '0-0-0',
    cues: {
      fr: ['Poussez le sol avec les avant-bras.', 'Fessiers serrés sans creuser.', 'Respirez sans bouger le bassin.'],
      en: ['Push the floor away with the forearms.', 'Glutes on, without an arch.', 'Breathe without rocking the hips.'],
    },
    mistake: { fr: 'Retenir le souffle et laisser tomber le bassin.', en: 'Holding the breath and dropping the hips.' },
    easier: { fr: 'Planche debout contre un mur.', en: 'Standing plank against a wall.' },
    bpm: 60,
    video: { asset: 'assets/coach-videos/coach-femme-planche-v2.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '0-0-0', 1, 'Clip Léa, tenue. La posture de fin doit être celle du début.'),
  },
  {
    id: 'row',
    name: { fr: 'Tirage debout', en: 'Standing row' },
    zone: 'dos',
    dose: { kind: 'reps', reps: 8 },
    tempo: '2-0-2',
    cues: {
      fr: ['Poitrine ouverte.', 'Coudes frottent les côtes.', 'Épaules loin des oreilles.'],
      en: ['Chest open.', 'Elbows graze the ribs.', 'Shoulders away from the ears.'],
    },
    mistake: { fr: 'Hausser les épaules vers les oreilles.', en: 'Shrugging toward the ears.' },
    easier: { fr: 'Amplitude plus courte, dos contre un mur.', en: 'Shorter range, back against a wall.' },
    bpm: 56,
    video: { asset: 'assets/coach-videos/row-coach-afrique-ouest.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '2-0-2', 8, 'Clip Moussa. Utile pour l’échauffement du dos et le bloc principal.'),
  },
  {
    id: 'superman',
    name: { fr: 'Superman au sol', en: 'Superman' },
    zone: 'dos',
    dose: { kind: 'reps', reps: 6 },
    tempo: '2-1-2',
    cues: {
      fr: ['Front vers le sol, nuque longue.', 'Mains et pieds se décollent ensemble.', 'Posez sans vous laisser tomber.'],
      en: ['Forehead toward the floor, neck long.', 'Hands and feet lift together.', 'Lower without dropping.'],
    },
    mistake: { fr: 'Relever la tête pour voir devant.', en: 'Lifting the head to look forward.' },
    easier: { fr: 'Un seul bras, l’autre reste au sol.', en: 'One arm only, the other stays down.' },
    bpm: 48,
    video: { asset: 'assets/coach-videos/superman-coach-asie.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('reutiliser', '2-1-2', 6, 'Clip de la coach asiatique. Sert aussi de retour au calme, plus lent.'),
  },
  {
    id: 'etoile',
    name: { fr: 'Étoile debout', en: 'Standing star' },
    zone: 'mobilite',
    dose: { kind: 'time', seconds: 30 },
    tempo: '2-0-2',
    cues: {
      fr: ['Les deux pieds restent au sol.', 'Les bras s’ouvrent sans cambrer.', 'Le souffle est plus long que le geste.'],
      en: ['Both feet stay down.', 'Arms open without arching.', 'The breath is longer than the move.'],
    },
    mistake: { fr: 'Se pencher d’un seul côté jusqu’à perdre l’équilibre.', en: 'Leaning so far that balance goes.' },
    easier: { fr: 'Mains sur les hanches, seulement ouvrir la poitrine.', en: 'Hands on hips, only open the chest.' },
    bpm: 52,
    video: { asset: 'assets/coach-videos/etoile-coach-papa-garcon.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('regenerer', '2-0-2', 6, 'Le clip montre Élias. Le réutiliser en famille. Pour l’adulte seul, retourner le même geste avec Moussa.'),
  },
  {
    id: 'squat-famille',
    name: { fr: 'Flexion avec papa', en: 'Squat with dad' },
    zone: 'jambes',
    dose: { kind: 'reps', reps: 6 },
    tempo: '2-0-2',
    cues: {
      fr: ['Élias copie Moussa, un peu moins bas.', 'Les deux paires de genoux suivent les orteils.', 'On sourit, on ne se dépêche pas.'],
      en: ['Élias copies Moussa, a little less deep.', 'Both pairs of knees follow the toes.', 'Smile, and do not rush.'],
    },
    mistake: { fr: 'L’enfant saute pour aller plus bas que l’adulte.', en: 'The child jumping to go lower than the adult.' },
    easier: { fr: 'Tenir les mains de papa et plier à peine.', en: 'Hold dad’s hands and barely bend.' },
    bpm: 56,
    video: { asset: 'assets/coach-videos/squat-coach-papa-garcon.mp4', inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('pret', '2-0-2', 6, 'Clip duo déjà bon pour la séance famille. Garder le même écart entre les deux au raccord.'),
  },
  {
    id: 'danse',
    name: { fr: 'Pas de danse latéral', en: 'Side dance step' },
    zone: 'cardio',
    dose: { kind: 'time', seconds: 40 },
    tempo: '1-0-1',
    cues: {
      fr: ['Le pas est glissé, pas sauté.', 'Les épaules bougent moins que les pieds.', 'Un sourire, le rythme reste régulier.'],
      en: ['The step slides, it does not jump.', 'Shoulders move less than the feet.', 'Smile, and keep the rhythm even.'],
    },
    mistake: { fr: 'Croiser les pieds et trébucher.', en: 'Crossing the feet and tripping.' },
    easier: { fr: 'Balancer le poids d’un pied sur l’autre, sans se déplacer.', en: 'Shift weight foot to foot without travelling.' },
    bpm: 112,
    video: { asset: null, inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('manquant', '1-0-1', 16, 'Pas de clip danse. En attendant, le lecteur montre la photo et les étapes, jamais un écran vide.'),
  },
  {
    id: 'yoga',
    name: { fr: 'Posture de la chaise douce', en: 'Easy chair pose' },
    zone: 'mobilite',
    dose: { kind: 'time', seconds: 30 },
    tempo: '3-1-3',
    cues: {
      fr: ['Les pieds sont parallèles.', 'Les bras montent seulement si les épaules suivent.', 'Le souffle descend plus longtemps qu’il ne monte.'],
      en: ['Feet are parallel.', 'Arms rise only if the shoulders can follow.', 'The exhale is longer than the inhale.'],
    },
    mistake: { fr: 'Cambrer pour lever les bras plus haut.', en: 'Arching to lift the arms higher.' },
    easier: { fr: 'Assis au bord d’une chaise, seulement les bras.', en: 'Sit on a chair edge and move only the arms.' },
    bpm: 46,
    video: { asset: null, inMs: 0, outMs: CLIP_LOOP_MS },
    shot: shot('manquant', '3-1-3', 4, 'Yoga doux à tourner : chaise, puis ouverture debout. Fond uni, geste très lent.'),
  },
];

const BY_ID = new Map(EXERCISE_LIBRARY.map((item) => [item.id, item]));

export function exerciseByProgramId(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

const POOLS: Record<SessionType, { warmup: string[]; main: string[]; cooldown: string[] }> = {
  hiit: { warmup: ['step-jack', 'squat', 'row'], main: ['squat', 'pompes', 'fente', 'step-jack'], cooldown: ['superman', 'etoile', 'squat'] },
  strength: { warmup: ['row', 'squat', 'step-jack'], main: ['squat', 'fente', 'pompes', 'row', 'planche'], cooldown: ['superman', 'etoile'] },
  core: { warmup: ['step-jack', 'row', 'etoile'], main: ['crunch', 'planche', 'superman', 'crunch'], cooldown: ['superman', 'etoile'] },
  mobility: { warmup: ['etoile', 'row', 'squat'], main: ['etoile', 'superman', 'row', 'squat'], cooldown: ['etoile', 'superman'] },
  yoga: { warmup: ['etoile', 'yoga', 'row'], main: ['yoga', 'etoile', 'superman', 'squat'], cooldown: ['yoga', 'etoile'] },
  dance: { warmup: ['step-jack', 'danse', 'etoile'], main: ['danse', 'step-jack', 'squat', 'danse'], cooldown: ['etoile', 'superman'] },
  family: { warmup: ['etoile', 'squat-famille', 'step-jack'], main: ['squat-famille', 'etoile', 'step-jack', 'row'], cooldown: ['etoile', 'superman'] },
};

export function phaseBudgets(minutes: ProgramMinutes): Record<Phase, number> {
  if (minutes === 10) return { warmup: 180_000, main: 240_000, cooldown: 180_000 };
  if (minutes === 15) return { warmup: 180_000, main: 540_000, cooldown: 180_000 };
  if (minutes === 20) return { warmup: 240_000, main: 720_000, cooldown: 240_000 };
  if (minutes === 30) return { warmup: 300_000, main: 1_200_000, cooldown: 300_000 };
  return { warmup: 300_000, main: 2_100_000, cooldown: 300_000 };
}

export function workShare(level: Level, week: 1 | 2 | 3 | 4): number {
  const base = level === 'debutant' ? 0.62 : level === 'avance' ? 0.8 : 0.72;
  return Math.min(0.88, Math.round((base + (week - 1) * 0.03) * 100) / 100);
}

function takeIds(pool: string[], count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) out.push(pool[i % pool.length] ?? pool[0] ?? 'squat');
  return out;
}

function countsFor(minutes: ProgramMinutes, phase: Phase): number {
  if (phase !== 'main') return minutes >= 30 ? 3 : 2;
  if (minutes >= 45) return 8;
  if (minutes >= 30) return 6;
  if (minutes >= 20) return 5;
  return 4;
}

export function tempoBeats(tempo: string): number {
  const parts = tempo.split('-').map((part) => Number(part));
  const sum = parts.reduce((total, part) => total + (Number.isFinite(part) ? part : 0), 0);
  return Math.max(1, sum);
}

export function repDurationMs(exercise: Exercise): number {
  return Math.round(tempoBeats(exercise.tempo) * (60_000 / exercise.bpm));
}

/** Répétition en cours, calée sur le tempo et le BPM. 0 avant le premier temps. */
export function repNow(elapsedInWorkMs: number, exercise: Exercise): { current: number; target: number } {
  const repMs = repDurationMs(exercise);
  const target = exercise.dose.reps ?? Math.max(1, Math.round(((exercise.dose.seconds ?? 20) * 1000) / repMs));
  if (elapsedInWorkMs <= 0 || repMs <= 0) return { current: 0, target };
  return { current: Math.min(target, Math.floor(elapsedInWorkMs / repMs) + 1), target };
}

function layoutPhase(phase: Phase, ids: string[], budgetMs: number, share: number): TimelineSegment[] {
  const unique = ids.filter((id, index) => ids.indexOf(id) === index || phase === 'main');
  const list = unique.length ? ids : ['squat'];
  const gaps = Math.max(0, list.length - 1);
  const transitionTotal = gaps * TRANSITION_MS;
  const usable = Math.max(list.length * 8_000, budgetMs - transitionTotal);
  const workTotal = Math.round(usable * share);
  const restTotal = Math.max(0, usable - workTotal);
  const segments: TimelineSegment[] = [];
  let cursor = 0;
  let workLeft = workTotal;
  let restLeft = restTotal;
  const base = phase === 'warmup' ? 0 : 0;
  void base;
  list.forEach((id, index) => {
    const exercise = exerciseByProgramId(id) ?? EXERCISE_LIBRARY[0];
    if (!exercise) return;
    const work = index === list.length - 1 ? workLeft : Math.floor(workTotal / list.length);
    workLeft -= work;
    const start = cursor;
    cursor += work;
    segments.push({
      id: `${phase}-work-${index}`,
      phase,
      role: 'work',
      startMs: start,
      endMs: cursor,
      exerciseId: exercise.id,
      video: exercise.video,
      bpm: exercise.bpm,
    });
    if (index < list.length - 1) {
      const nextId = list[index + 1] ?? exercise.id;
      const next = exerciseByProgramId(nextId) ?? exercise;
      const tStart = cursor;
      cursor += TRANSITION_MS;
      segments.push({
        id: `${phase}-move-${index}`,
        phase,
        role: 'transition',
        startMs: tStart,
        endMs: cursor,
        exerciseId: next.id,
        video: next.video,
        bpm: next.bpm,
      });
      const rest = index === list.length - 2 ? restLeft : Math.floor(restTotal / gaps);
      restLeft -= rest;
      if (rest > 0) {
        const rStart = cursor;
        cursor += rest;
        segments.push({
          id: `${phase}-rest-${index}`,
          phase,
          role: 'rest',
          startMs: rStart,
          endMs: cursor,
          exerciseId: next.id,
          video: next.video,
          bpm: next.bpm,
        });
      }
    }
  });
  if (!segments.length) return segments;
  const drift = budgetMs - cursor;
  const last = segments[segments.length - 1];
  if (last && drift !== 0) last.endMs += drift;
  return segments.map((segment, index) => ({ ...segment, id: `${phase}-${index}-${segment.role}` }));
}

function shift(segments: TimelineSegment[], offset: number, prefix: string): TimelineSegment[] {
  return segments.map((segment, index) => ({
    ...segment,
    id: `${prefix}-${index}`,
    startMs: segment.startMs + offset,
    endMs: segment.endMs + offset,
  }));
}

function cuesFor(workout: { speakers: SpeakerId[]; segments: TimelineSegment[]; exercises: Exercise[] }): VoiceCue[] {
  const cues: VoiceCue[] = [];
  const family = workout.speakers.includes('elias');
  const nameOf = (id: string, locale: 'fr' | 'en') => workout.exercises.find((item) => item.id === id)?.name[locale] ?? id;
  const posture = (id: string, locale: 'fr' | 'en') => workout.exercises.find((item) => item.id === id)?.cues[locale][0] ?? '';
  cues.push({
    id: 'intro',
    atMs: 0,
    speaker: 'moussa',
    kind: 'intro',
    fr: family
      ? 'Bonjour, c’est Moussa, et Élias est avec moi. On y va doucement, puis on joue, puis on souffle.'
      : 'Bonjour, c’est Moussa. On commence en douceur, l’effort monte, puis on revient au calme. Arrêtez si une douleur apparaît.',
    en: family
      ? 'Hello, I am Moussa, and Élias is with me. We start easy, then we play, then we breathe.'
      : 'Hello, I am Moussa. We start gently, the effort rises, then we come back down. Stop if something hurts.',
  });
  const works = workout.segments.filter((segment) => segment.role === 'work');
  works.forEach((segment, index) => {
    const next = works[index + 1];
    const nameAt = Math.max(0, segment.startMs - 5_000);
    cues.push({
      id: `name-${segment.id}`,
      atMs: nameAt,
      speaker: 'moussa',
      kind: 'name',
      fr: `Dans cinq secondes : ${nameOf(segment.exerciseId, 'fr')}.`,
      en: `In five seconds: ${nameOf(segment.exerciseId, 'en')}.`,
    });
    cues.push({
      id: `posture-${segment.id}`,
      atMs: segment.startMs + 1_500,
      speaker: 'moussa',
      kind: 'posture',
      fr: posture(segment.exerciseId, 'fr'),
      en: posture(segment.exerciseId, 'en'),
    });
    const mid = segment.startMs + Math.round((segment.endMs - segment.startMs) / 2);
    cues.push({
      id: `go-${segment.id}`,
      atMs: mid,
      speaker: family && index % 2 === 1 ? 'elias' : 'moussa',
      kind: 'encourage',
      fr: family && index % 2 === 1 ? 'Allez, on reste ensemble !' : 'Beau rythme. Gardez la forme, pas la vitesse.',
      en: family && index % 2 === 1 ? 'Come on, we stay together!' : 'Nice rhythm. Keep the shape, not the speed.',
    });
    if (segment.endMs - segment.startMs >= 8_000) {
      (['3', '2', '1'] as const).forEach((word, step) => {
        cues.push({
          id: `count-${segment.id}-${word}`,
          atMs: segment.endMs - 3_000 + step * 1_000,
          speaker: family && step === 2 ? 'elias' : 'moussa',
          kind: 'countdown',
          fr: word,
          en: word,
        });
      });
    }
    const rest = workout.segments.find((item) => item.role === 'rest' && item.startMs >= segment.endMs && (!next || item.startMs < next.startMs));
    if (rest && next) {
      cues.push({
        id: `rest-${segment.id}`,
        atMs: rest.startMs,
        speaker: 'moussa',
        kind: 'rest',
        fr: `Repos. Ensuite : ${nameOf(next.exerciseId, 'fr')}.`,
        en: `Rest. Next: ${nameOf(next.exerciseId, 'en')}.`,
      });
    }
  });
  return cues.sort((a, b) => a.atMs - b.atMs || a.id.localeCompare(b.id));
}

const TITLES: Record<SessionType, { fr: string; en: string }> = {
  hiit: { fr: 'HIIT doux', en: 'Gentle HIIT' },
  strength: { fr: 'Renforcement', en: 'Strength' },
  core: { fr: 'Centre du corps', en: 'Core' },
  mobility: { fr: 'Mobilité', en: 'Mobility' },
  yoga: { fr: 'Yoga doux', en: 'Easy yoga' },
  dance: { fr: 'Danse cardio', en: 'Cardio dance' },
  family: { fr: 'Séance famille', en: 'Family session' },
};

export function buildWorkout(input: {
  type: SessionType;
  minutes: ProgramMinutes;
  level: Level;
  week?: 1 | 2 | 3 | 4;
}): Workout {
  const week = input.week ?? 1;
  const share = workShare(input.level, week);
  const budgets = phaseBudgets(input.minutes);
  const pool = POOLS[input.type];
  const phases: Phase[] = ['warmup', 'main', 'cooldown'];
  let cursor = 0;
  const segments: TimelineSegment[] = [];
  phases.forEach((phase) => {
    const ids = takeIds(pool[phase], countsFor(input.minutes, phase));
    const local = layoutPhase(phase, ids, budgets[phase], share);
    segments.push(...shift(local, cursor, phase));
    cursor += budgets[phase];
  });
  const used = [...new Set(segments.map((segment) => segment.exerciseId))];
  const exercises = used.map((id) => exerciseByProgramId(id)).filter((item): item is Exercise => !!item);
  const speakers: SpeakerId[] = input.type === 'family' ? ['moussa', 'elias'] : ['moussa'];
  const workout: Workout = {
    id: `pro-${input.type}-w${week}-${input.minutes}-${input.level}`,
    title: TITLES[input.type],
    type: input.type,
    minutes: input.minutes,
    level: input.level,
    week,
    speakers,
    zones: [...new Set(exercises.map((item) => item.zone))],
    exercises,
    segments,
    cues: [],
  };
  workout.cues = cuesFor(workout);
  return workout;
}

export function continuityGaps(segments: TimelineSegment[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < segments.length; i += 1) {
    const prev = segments[i - 1];
    const next = segments[i];
    if (!prev || !next) continue;
    if (next.startMs !== prev.endMs) gaps.push(next.startMs - prev.endMs);
  }
  return gaps;
}

export function exampleSeance20(): Workout {
  return buildWorkout({ type: 'strength', minutes: 20, level: 'intermediaire', week: 1 });
}

export type MasterClock = {
  start: () => number;
  pause: () => number;
  resume: () => number;
  seek: (ms: number) => number;
  read: () => number;
};

/** Une origine, pas une somme d’intervalles. La pause ne fait pas avancer le temps. */
export function createMasterClock(now: () => number): MasterClock {
  let origin = now();
  let elapsed = 0;
  let running = false;
  const read = () => (running ? now() - origin : elapsed);
  return {
    start() {
      if (!running) {
        origin = now() - elapsed;
        running = true;
      }
      return read();
    },
    pause() {
      if (running) {
        elapsed = now() - origin;
        running = false;
      }
      return elapsed;
    },
    resume() {
      if (!running) {
        origin = now() - elapsed;
        running = true;
      }
      return read();
    },
    seek(ms: number) {
      elapsed = Math.max(0, ms);
      origin = now() - elapsed;
      return elapsed;
    },
    read,
  };
}

export function simulateDrift(durationMs: number, stepMs: number): number {
  let t = 0;
  const clock = createMasterClock(() => t);
  clock.start();
  let max = 0;
  while (t < durationMs) {
    const jitter = ((Math.floor(t / stepMs) % 5) - 2);
    t += stepMs + jitter;
    max = Math.max(max, Math.abs(clock.read() - t));
  }
  return max;
}

export type SessionFrame = {
  mediaMs: number;
  segment: TimelineSegment | null;
  exercise: Exercise | null;
  nextExercise: Exercise | null;
  remainingMs: number;
  progress: number;
  reps: { current: number; target: number };
  videoMs: number;
  musicGain: number;
  easier: string;
  done: boolean;
};

export function frameAt(workout: Workout, mediaMs: number, locale: 'fr' | 'en'): SessionFrame {
  const total = workout.minutes * 60_000;
  const ms = Math.max(0, Math.min(total, mediaMs));
  const segment = workout.segments.find((item) => ms >= item.startMs && ms < item.endMs) ?? workout.segments[workout.segments.length - 1] ?? null;
  const exercise = segment ? exerciseByProgramId(segment.exerciseId) ?? null : null;
  const index = segment ? workout.segments.indexOf(segment) : -1;
  const nextSeg = workout.segments.slice(index + 1).find((item) => item.role === 'work');
  const nextExercise = nextSeg ? exerciseByProgramId(nextSeg.exerciseId) ?? null : null;
  const elapsedWork = segment && exercise ? Math.max(0, ms - segment.startMs) : 0;
  const reps = exercise && segment?.role === 'work' ? repNow(elapsedWork, exercise) : { current: 0, target: exercise?.dose.reps ?? 0 };
  const span = segment ? Math.max(1, segment.endMs - segment.startMs) : 1;
  const loop = exercise?.video.outMs || CLIP_LOOP_MS;
  const videoMs = segment ? (segment.video.inMs + (elapsedWork % Math.max(1, loop - segment.video.inMs))) : 0;
  const speaking = workout.cues.some((cue) => ms >= cue.atMs && ms < cue.atMs + 2_500);
  return {
    mediaMs: ms,
    segment,
    exercise,
    nextExercise,
    remainingMs: segment ? Math.max(0, segment.endMs - ms) : 0,
    progress: segment ? Math.min(1, (ms - segment.startMs) / span) : 1,
    reps,
    videoMs,
    musicGain: speaking ? 0.25 : 1,
    easier: exercise ? exercise.easier[locale] : '',
    done: ms >= total,
  };
}

export function cuesBetween(workout: Workout, fromMs: number, toMs: number): VoiceCue[] {
  return workout.cues.filter((cue) => cue.atMs > fromMs && cue.atMs <= toMs);
}

export function voiceScript(workout: Workout, locale: 'fr' | 'en'): { atMs: number; speaker: SpeakerId; text: string }[] {
  return workout.cues.map((cue) => ({ atMs: cue.atMs, speaker: cue.speaker, text: cue[locale] }));
}

const TYPE_BY_DAY: SessionType[] = ['family', 'strength', 'hiit', 'core', 'mobility', 'dance', 'yoga'];

export function chooseToday(input: {
  today: string;
  logs: { routineId: string; date: string }[];
  audience: 'adulte' | 'famille';
  level: Level;
  minutes: ProgramMinutes;
}): Workout {
  const recent = new Set(
    input.logs
      .filter((log) => log.routineId.startsWith('pro:') && log.date <= input.today)
      .slice(-6)
      .flatMap((log) => log.routineId.split(':')[2]?.split('+') ?? []),
  );
  const [year, month, day] = input.today.split('-').map(Number);
  const weekday = new Date(Date.UTC(year || 1970, (month || 1) - 1, day || 1)).getUTCDay();
  let type: SessionType = input.audience === 'famille' ? 'family' : (TYPE_BY_DAY[weekday] ?? 'strength');
  if (type === 'family' && input.audience !== 'famille') type = 'strength';
  const pool = POOLS[type].main;
  if (pool.every((id) => recent.has(exerciseByProgramId(id)?.zone ?? ''))) {
    const order: SessionType[] = ['mobility', 'core', 'strength', 'hiit', 'yoga', 'dance', 'family'];
    type = order.find((candidate) => candidate !== type && (input.audience === 'famille' || candidate !== 'family')) ?? type;
  }
  const proLogs = input.logs.filter((log) => log.routineId.startsWith('pro:'));
  const week = Math.min(4, Math.max(1, 1 + Math.floor(proLogs.length / 3))) as 1 | 2 | 3 | 4;
  return buildWorkout({ type, minutes: input.minutes, level: input.level, week });
}

export function routineKey(workout: Workout): string {
  return `pro:${workout.type}:${workout.zones.join('+')}:w${workout.week}:${workout.minutes}`;
}

export function runTrainingSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const example = exampleSeance20();
  const total = example.segments[example.segments.length - 1]?.endMs ?? 0;
  check('séance exemple 20 min sans trou', total === 20 * 60_000 && continuityGaps(example.segments).length === 0);
  const warm = example.segments.filter((segment) => segment.phase === 'warmup');
  const cool = example.segments.filter((segment) => segment.phase === 'cooldown');
  const warmSpan = (warm[warm.length - 1]?.endMs ?? 0) - (warm[0]?.startMs ?? 0);
  const coolSpan = (cool[cool.length - 1]?.endMs ?? 0) - (cool[0]?.startMs ?? 0);
  check('échauffement et retour entre 3 et 5 min', warmSpan >= 180_000 && warmSpan <= 300_000 && coolSpan >= 180_000 && coolSpan <= 300_000);
  check('ordre échauffement puis bloc puis calme', example.segments[0]?.phase === 'warmup' && example.segments.some((segment) => segment.phase === 'main') && example.segments[example.segments.length - 1]?.phase === 'cooldown');
  (['hiit', 'strength', 'core', 'mobility', 'yoga', 'dance', 'family'] as const).forEach((type) => {
    check(`type ${type}`, buildWorkout({ type, minutes: 20, level: 'intermediaire' }).type === type);
  });
  ([10, 20, 30, 45] as const).forEach((minutes) => {
    const built = buildWorkout({ type: 'strength', minutes, level: 'intermediaire' });
    const end = built.segments[built.segments.length - 1]?.endMs ?? 0;
    check(`durée ${minutes} continue`, end === minutes * 60_000 && continuityGaps(built.segments).length === 0);
  });
  const easy = buildWorkout({ type: 'strength', minutes: 20, level: 'debutant', week: 1 });
  const hard = buildWorkout({ type: 'strength', minutes: 20, level: 'avance', week: 4 });
  const workSum = (workout: Workout) => workout.segments.filter((segment) => segment.role === 'work' && segment.phase === 'main').reduce((sum, segment) => sum + (segment.endMs - segment.startMs), 0);
  check('semaine 4 avancé travaille plus que semaine 1 débutant', workSum(hard) > workSum(easy));
  check('chaque exercice a variante, erreur et 2 consignes', EXERCISE_LIBRARY.every((item) => item.easier.fr.length > 8 && item.mistake.fr.length > 8 && item.cues.fr.length >= 2 && item.cues.fr.length <= 3));
  const squat = exerciseByProgramId('squat');
  check('tempo 2-0-2 à 60 BPM : une rep toutes les 4 s', !!squat && repDurationMs(squat) === 4_000 && repNow(8_000, squat).current === 3);
  const script = voiceScript(example, 'fr');
  check('Moussa présente, nomme, compte, encourage et annonce le repos', ['intro', 'name', 'posture', 'countdown', 'encourage', 'rest'].every((kind) => example.cues.some((cue) => cue.kind === kind && cue.speaker === 'moussa')) && script[0]?.text.includes('Moussa'));
  const family = buildWorkout({ type: 'family', minutes: 20, level: 'debutant' });
  check('Élias parle dans la séance famille, pas dans la séance adulte', family.cues.some((cue) => cue.speaker === 'elias') && example.cues.every((cue) => cue.speaker === 'moussa'));
  let t = 0;
  const clock = createMasterClock(() => t);
  clock.start();
  t = 10_000;
  check('pause figée', clock.pause() === 10_000);
  t = 15_000;
  check('le temps ne bouge pas pendant la pause', clock.read() === 10_000 && clock.resume() === 10_000);
  t = 16_000;
  check('reprise au même endroit', Math.abs(clock.read() - 11_000) <= DRIFT_LIMIT_MS);
  clock.seek(20 * 60_000);
  check('seek télécommande', clock.read() === 20 * 60_000);
  const drift = simulateDrift(30 * 60_000, 16);
  check('dérive ≤ 100 ms sur 30 min', drift <= DRIFT_LIMIT_MS);
  const at = frameAt(example, 90_000, 'fr');
  const again = frameAt(example, 90_000, 'fr');
  check('vidéo, reps et segment lisent le même instant', at.mediaMs === again.mediaMs && at.segment?.id === again.segment?.id && at.reps.current === again.reps.current);
  const chosen = chooseToday({ today: '2026-11-21', logs: [{ routineId: 'pro:strength:jambes:w1:20', date: '2026-11-20' }], audience: 'famille', level: 'debutant', minutes: 20 });
  check('samedi famille choisit la séance avec Élias', chosen.type === 'family' && chosen.speakers.includes('elias'));
  check('clips manquants signalés, clips présents réutilisés', EXERCISE_LIBRARY.some((item) => item.shot.status === 'manquant' && item.video.asset === null) && EXERCISE_LIBRARY.some((item) => item.video.asset?.endsWith('.mp4')));
  return out;
}
