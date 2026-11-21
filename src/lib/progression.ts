/**
 * Séance corps complet : une seule montée d’effort, puis le retour au calme.
 * Mobilité → jambes → bras → abdos/tronc → dos → cardio → retour.
 * Aucune écriture disque. Les vidéos manquantes ne cassent pas le plan.
 */
import { exerciseById, exercisesFor, type BodyPartId, type LibraryExercise, type RosterCoachId } from './coachLibrary';

export const SESSION_MINUTES = [10, 15, 20, 30] as const;
export type SessionMinutes = (typeof SESSION_MINUTES)[number];

export const SESSION_LEVELS = ['debutant', 'intermediaire', 'avance'] as const;
export type SessionLevel = (typeof SESSION_LEVELS)[number];

export const SESSION_AUDIENCES = ['adulte', 'famille'] as const;
export type SessionAudience = (typeof SESSION_AUDIENCES)[number];

export const INTENSITY_PHASES = ['echauffement', 'montee', 'intense', 'retour'] as const;
export type IntensityPhase = (typeof INTENSITY_PHASES)[number];

export const TEMPOS = ['lent', 'modere', 'rapide'] as const;
export type Tempo = (typeof TEMPOS)[number];

export type PhaseTiming = { work: number; rest: number; tempo: Tempo };

const ADULT: Record<SessionLevel, Record<'echauffement' | 'montee' | 'intense', PhaseTiming>> = {
  debutant: {
    echauffement: { work: 20, rest: 25, tempo: 'lent' },
    montee: { work: 25, rest: 20, tempo: 'modere' },
    intense: { work: 30, rest: 18, tempo: 'rapide' },
  },
  intermediaire: {
    echauffement: { work: 20, rest: 20, tempo: 'lent' },
    montee: { work: 30, rest: 15, tempo: 'modere' },
    intense: { work: 40, rest: 10, tempo: 'rapide' },
  },
  avance: {
    echauffement: { work: 20, rest: 15, tempo: 'lent' },
    montee: { work: 35, rest: 12, tempo: 'modere' },
    intense: { work: 45, rest: 8, tempo: 'rapide' },
  },
};

/** Pic plus bas que l’adulte : le travail intense reste court, le repos reste large. */
const FAMILY: Record<SessionLevel, Record<'echauffement' | 'montee' | 'intense', PhaseTiming>> = {
  debutant: {
    echauffement: { work: 15, rest: 25, tempo: 'lent' },
    montee: { work: 20, rest: 20, tempo: 'modere' },
    intense: { work: 20, rest: 20, tempo: 'rapide' },
  },
  intermediaire: {
    echauffement: { work: 15, rest: 20, tempo: 'lent' },
    montee: { work: 20, rest: 18, tempo: 'modere' },
    intense: { work: 25, rest: 15, tempo: 'rapide' },
  },
  avance: {
    echauffement: { work: 20, rest: 20, tempo: 'lent' },
    montee: { work: 25, rest: 15, tempo: 'modere' },
    intense: { work: 30, rest: 15, tempo: 'rapide' },
  },
};

export const PHASE_TIMING: Record<SessionAudience, Record<SessionLevel, Record<'echauffement' | 'montee' | 'intense', PhaseTiming>>> = {
  adulte: ADULT,
  famille: FAMILY,
};

export const COOLDOWN_TIMING: Record<SessionAudience, PhaseTiming> = {
  adulte: { work: 20, rest: 20, tempo: 'lent' },
  famille: { work: 15, rest: 20, tempo: 'lent' },
};

const ARC: { phase: IntensityPhase; areas: BodyPartId[]; share: number }[] = [
  { phase: 'echauffement', areas: ['mobilite'], share: 0.18 },
  { phase: 'montee', areas: ['jambes', 'bras'], share: 0.27 },
  { phase: 'intense', areas: ['abdos', 'dos', 'cardio'], share: 0.4 },
  { phase: 'retour', areas: ['mobilite'], share: 0.15 },
];

export type SessionBlock = {
  exerciseId: string;
  area: BodyPartId;
  phase: IntensityPhase;
  workSec: number;
  restSec: number;
  tempo: Tempo;
};

export type ProgressiveSession = {
  title: string;
  minutes: SessionMinutes;
  level: SessionLevel;
  audience: SessionAudience;
  coachId: RosterCoachId;
  blocks: SessionBlock[];
  totalSec: number;
};

export type ClipRef = { asset: string | null; url: string | null };

export function videoFileName(exerciseId: string, coachId: string, variant?: 'lent' | 'intense'): string {
  return variant ? `${exerciseId}-${coachId}-${variant}.mp4` : `${exerciseId}-${coachId}.mp4`;
}

export function videoAssetPath(exerciseId: string, coachId: string, variant?: 'lent' | 'intense'): string {
  return `assets/coach-videos/${videoFileName(exerciseId, coachId, variant)}`;
}

export function isSessionMinutes(value: unknown): value is SessionMinutes {
  return SESSION_MINUTES.includes(Number(value) as SessionMinutes);
}

export function isSessionLevel(value: unknown): value is SessionLevel {
  return value === 'debutant' || value === 'intermediaire' || value === 'avance';
}

export function phaseRank(phase: IntensityPhase): number {
  return INTENSITY_PHASES.indexOf(phase);
}

export function blockCost(block: Pick<SessionBlock, 'workSec' | 'restSec'>): number {
  return block.workSec + block.restSec;
}

export function sessionSeconds(blocks: Pick<SessionBlock, 'workSec' | 'restSec'>[]): number {
  return blocks.reduce((sum, block) => sum + blockCost(block), 0);
}

function familyPool(area: BodyPartId): LibraryExercise[] {
  const kids = exercisesFor('enfants');
  const one = (id: string) => {
    const found = kids.find((item) => item.id === id);
    if (!found) throw new Error(`mouvement enfant manquant: ${id}`);
    return found;
  };
  const map: Record<string, LibraryExercise[]> = {
    mobilite: [one('etoile'), one('flamant')],
    jambes: [one('squat-famille'), one('grenouille')],
    bras: [one('cercles-jeu')],
    abdos: [one('planche-genoux')],
    dos: [one('ours')],
    cardio: [one('marche-jeu')],
  };
  return map[area] ?? [one('etoile')];
}

function adultPool(area: BodyPartId, level: SessionLevel): LibraryExercise[] {
  const all = exercisesFor(area);
  if (level === 'debutant') {
    const gentle = all.filter((item) => item.level === 'debutant');
    if (gentle.length) return gentle;
  }
  return all;
}

function poolFor(area: BodyPartId, audience: SessionAudience, level: SessionLevel): LibraryExercise[] {
  return audience === 'famille' ? familyPool(area) : adultPool(area, level);
}

function timingFor(audience: SessionAudience, level: SessionLevel, phase: IntensityPhase): PhaseTiming {
  if (phase === 'retour') return COOLDOWN_TIMING[audience];
  return PHASE_TIMING[audience][level][phase];
}

function makeBlock(exercise: LibraryExercise, area: BodyPartId, phase: IntensityPhase, timing: PhaseTiming): SessionBlock {
  return {
    exerciseId: exercise.id,
    area,
    phase,
    workSec: timing.work,
    restSec: timing.rest,
    tempo: timing.tempo,
  };
}

function fillPhase(audience: SessionAudience, level: SessionLevel, phase: IntensityPhase, areas: BodyPartId[], budget: number): SessionBlock[] {
  const timing = timingFor(audience, level, phase);
  const cost = timing.work + timing.rest;
  const cursors = areas.map((area) => ({ area, items: poolFor(area, audience, level), n: 0 }));
  const blocks: SessionBlock[] = [];
  let used = 0;
  for (const cursor of cursors) {
    const exercise = cursor.items[0];
    if (!exercise) continue;
    blocks.push(makeBlock(exercise, cursor.area, phase, timing));
    used += cost;
    cursor.n = 1;
  }
  let guard = 0;
  while (guard < 48) {
    let added = false;
    for (const cursor of cursors) {
      if (!cursor.items.length || used + cost > budget) continue;
      const exercise = cursor.items[cursor.n % cursor.items.length];
      if (!exercise) continue;
      blocks.push(makeBlock(exercise, cursor.area, phase, timing));
      used += cost;
      cursor.n += 1;
      added = true;
    }
    if (!added) break;
    guard += 1;
  }
  return blocks;
}

function topUpIntense(audience: SessionAudience, level: SessionLevel, room: number): SessionBlock[] {
  const timing = timingFor(audience, level, 'intense');
  const cost = timing.work + timing.rest;
  const areas: BodyPartId[] = ['abdos', 'dos', 'cardio'];
  const extra: SessionBlock[] = [];
  let used = 0;
  let n = 0;
  while (used + cost <= room && n < 24) {
    const area = areas[n % areas.length];
    const items = poolFor(area, audience, level);
    const exercise = items[n % items.length];
    if (!exercise) break;
    extra.push(makeBlock(exercise, area, 'intense', timing));
    used += cost;
    n += 1;
  }
  return extra;
}

export function buildProgressiveSession(input: {
  minutes: SessionMinutes;
  level: SessionLevel;
  audience: SessionAudience;
  coachId: RosterCoachId;
}): ProgressiveSession {
  const audience = input.audience;
  const level = input.level;
  const target = input.minutes * 60;
  const coachId: RosterCoachId = audience === 'famille' ? 'coach-papa-garcon' : input.coachId;
  const raw = ARC.map((slot) => Math.floor(target * slot.share));
  raw[2] += target - raw.reduce((sum, n) => sum + n, 0);
  const echauffement = fillPhase(audience, level, 'echauffement', ARC[0].areas, raw[0]);
  const montee = fillPhase(audience, level, 'montee', ARC[1].areas, raw[1]);
  const intense = fillPhase(audience, level, 'intense', ARC[2].areas, raw[2]);
  const retour = fillPhase(audience, level, 'retour', ARC[3].areas, raw[3]);
  const spent = sessionSeconds([...echauffement, ...montee, ...intense, ...retour]);
  const extra = topUpIntense(audience, level, Math.max(0, target - spent));
  const blocks = [...echauffement, ...montee, ...intense, ...extra, ...retour];
  return {
    title: 'Séance corps complet progressive',
    minutes: input.minutes,
    level,
    audience,
    coachId,
    blocks,
    totalSec: sessionSeconds(blocks),
  };
}

function pushClip(list: ClipRef[], asset?: string, url?: string) {
  if (!asset && !url) return;
  const key = `${asset ?? ''}|${url ?? ''}`;
  if (list.some((item) => `${item.asset ?? ''}|${item.url ?? ''}` === key)) return;
  list.push({ asset: asset ?? null, url: url ?? null });
}

/**
 * Échauffement, montée et retour : clip lent, puis la vidéo unique.
 * Intense : clip intense, puis la vidéo unique.
 * Le fichier conventionnel est tenté même s’il n’est pas encore dans le bundle.
 */
export function clipCandidates(exercise: LibraryExercise, phase: IntensityPhase, coachId: RosterCoachId): ClipRef[] {
  const slowish = phase !== 'intense';
  const chosen = slowish ? exercise.videoSlow : exercise.videoIntense;
  const list: ClipRef[] = [];
  if (chosen && chosen.coachId === coachId) pushClip(list, chosen.asset, chosen.url);
  pushClip(list, videoAssetPath(exercise.id, coachId, slowish ? 'lent' : 'intense'));
  if (exercise.video && exercise.video.coachId === coachId) pushClip(list, exercise.video.asset, exercise.video.url);
  pushClip(list, videoAssetPath(exercise.id, coachId));
  return list;
}

/**
 * En ligne, une URL distante peut servir. Hors ligne, on la saute
 * et on continue vers un clip déjà dans le bundle. Sans clip, null :
 * l’écran montre la photo et les étapes, pas une plaque noire.
 */
export function pickClip(candidates: ClipRef[], hasAsset: (asset: string) => boolean, options?: { online?: boolean }): ClipRef | null {
  const online = options?.online !== false;
  for (const clip of candidates) {
    if (clip.asset && hasAsset(clip.asset)) return { asset: clip.asset, url: null };
    if (clip.url && online) return { asset: null, url: clip.url };
  }
  return null;
}

export type PlayClock = { index: number; mode: 'work' | 'rest' | 'done'; left: number; running: boolean };

/** Pas de bloc, ou un travail à 0 s : on ne lance pas un minuteur qui finirait par s’enregistrer. */
export function initialPlayClock(blocks: { workSec: number }[]): PlayClock {
  const first = blocks[0];
  if (!first || first.workSec <= 0) return { index: 0, mode: 'done', left: 0, running: false };
  return { index: 0, mode: 'work', left: first.workSec, running: true };
}

export function advancePlayClock(state: PlayClock, blocks: { workSec: number; restSec: number }[]): PlayClock {
  const block = blocks[state.index];
  if (!block) return { ...state, mode: 'done', running: false, left: 0 };
  if (state.mode === 'work' && block.restSec > 0) return { ...state, mode: 'rest', left: block.restSec };
  const next = state.index + 1;
  const following = blocks[next];
  if (!following) return { ...state, mode: 'done', running: false, left: 0 };
  return { ...state, index: next, mode: 'work', left: following.workSec };
}

export function tickPlayClock(state: PlayClock, blocks: { workSec: number; restSec: number }[]): PlayClock {
  if (!state.running || state.mode === 'done') return state;
  if (!blocks.length) return { ...state, mode: 'done', running: false, left: 0 };
  if (state.left > 1) return { ...state, left: state.left - 1 };
  return advancePlayClock(state, blocks);
}

/** Une séance sans bloc ne s’écrit pas dans le journal. */
export function shouldRecordWorkout(blockCount: number, mode: PlayClock['mode']): boolean {
  return blockCount > 0 && mode === 'done';
}

export function elapsedBefore(blocks: SessionBlock[], index: number): number {
  return sessionSeconds(blocks.slice(0, Math.max(0, index)));
}

export function runProgressionSelfTests(): { name: string; ok: boolean }[] {
  const out: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => out.push({ name, ok });
  const areas = ['mobilite', 'jambes', 'bras', 'abdos', 'dos', 'cardio'];
  const adult = buildProgressiveSession({ minutes: 20, level: 'intermediaire', audience: 'adulte', coachId: 'coach-femme' });
  const ranks = adult.blocks.map((block) => phaseRank(block.phase));
  check('les phases ne redescendent pas avant le retour', ranks.every((rank, i) => i === 0 || rank >= ranks[i - 1]));
  check('échauffement puis montée puis intense puis retour', adult.blocks[0]?.phase === 'echauffement' && adult.blocks[adult.blocks.length - 1]?.phase === 'retour' && adult.blocks.some((block) => block.phase === 'montee') && adult.blocks.some((block) => block.phase === 'intense'));
  const firstAreas: string[] = [];
  for (const block of adult.blocks) {
    if (block.phase === 'retour') continue;
    if (!firstAreas.includes(block.area)) firstAreas.push(block.area);
  }
  check('chaîne mobilité, jambes, bras, abdos, dos, cardio', firstAreas.join(',') === areas.join(','));
  check('retour sur la mobilité', adult.blocks.filter((block) => block.phase === 'retour').every((block) => block.area === 'mobilite'));
  const sample = (phase: IntensityPhase) => adult.blocks.find((block) => block.phase === phase);
  check('intermédiaire 20/20 lent', sample('echauffement')?.workSec === 20 && sample('echauffement')?.restSec === 20 && sample('echauffement')?.tempo === 'lent');
  check('intermédiaire 30/15 modéré', sample('montee')?.workSec === 30 && sample('montee')?.restSec === 15 && sample('montee')?.tempo === 'modere');
  check('intermédiaire 40/10 rapide', sample('intense')?.workSec === 40 && sample('intense')?.restSec === 10 && sample('intense')?.tempo === 'rapide');
  check('retour lent', sample('retour')?.tempo === 'lent' && (sample('retour')?.workSec ?? 99) <= 20);
  for (const level of SESSION_LEVELS) {
    const row = PHASE_TIMING.adulte[level];
    check(
      `adulte ${level} : le travail monte et le repos descend`,
      row.echauffement.work <= row.montee.work && row.montee.work <= row.intense.work && row.echauffement.rest >= row.montee.rest && row.montee.rest >= row.intense.rest,
    );
    const family = PHASE_TIMING.famille[level];
    check(
      `famille ${level} : pic plus doux que l’adulte intermédiaire`,
      family.intense.work < PHASE_TIMING.adulte.intermediaire.intense.work && family.intense.rest > PHASE_TIMING.adulte.intermediaire.intense.rest,
    );
  }
  check(
    'débutant < intermédiaire < avancé sur le pic adulte',
    PHASE_TIMING.adulte.debutant.intense.work < PHASE_TIMING.adulte.intermediaire.intense.work && PHASE_TIMING.adulte.intermediaire.intense.work < PHASE_TIMING.adulte.avance.intense.work,
  );
  const gentle = buildProgressiveSession({ minutes: 20, level: 'debutant', audience: 'adulte', coachId: 'coach-homme' });
  check(
    'débutant adulte : mouvements doux',
    gentle.blocks.every((block) => exerciseById(block.exerciseId)?.level === 'debutant'),
  );
  const family = buildProgressiveSession({ minutes: 30, level: 'avance', audience: 'famille', coachId: 'coach-homme' });
  check('famille verrouille Moussa et Élias', family.coachId === 'coach-papa-garcon' && family.audience === 'famille');
  check(
    'famille : gestes du petit coach',
    family.blocks.every((block) => exerciseById(block.exerciseId)?.coachId === 'coach-papa-garcon'),
  );
  check('famille avance : travail intense 30 s', family.blocks.find((block) => block.phase === 'intense')?.workSec === 30);
  const duo = exerciseById('squat-famille');
  check(
    'jambes famille : squat de Moussa et Élias',
    family.blocks.find((block) => block.area === 'jambes')?.exerciseId === 'squat-famille' && duo?.coachId === 'coach-papa-garcon' && duo?.video?.asset === 'assets/coach-videos/squat-coach-papa-garcon.mp4',
  );
  const duoClip = duo ? pickClip(clipCandidates(duo, 'montee', 'coach-papa-garcon'), (asset) => asset === duo.video?.asset) : null;
  check('la séance famille joue squat-coach-papa-garcon.mp4', duoClip?.asset === 'assets/coach-videos/squat-coach-papa-garcon.mp4');
  const clips: [string, string, RosterCoachId][] = [
    ['fente', 'assets/coach-videos/fente-coach-maghreb.mp4', 'coach-maghreb'],
    ['pompes', 'assets/coach-videos/pompes-coach-femme-voilee.mp4', 'coach-femme-voilee'],
    ['crunch', 'assets/coach-videos/crunch-coach-femme.mp4', 'coach-femme'],
    ['superman', 'assets/coach-videos/superman-coach-asie.mp4', 'coach-asie'],
    ['step-jack', 'assets/coach-videos/step-jack-coach-homme.mp4', 'coach-homme'],
    ['row', 'assets/coach-videos/row-coach-afrique-ouest.mp4', 'coach-afrique-ouest'],
    ['etoile', 'assets/coach-videos/etoile-coach-papa-garcon.mp4', 'coach-papa-garcon'],
  ];
  check(
    'démos branchées sur le bon coach, squat et planche d’origine gardés',
    clips.every(([id, asset, coach]) => {
      const item = exerciseById(id);
      return item?.coachId === coach && item.video?.coachId === coach && item.video.asset === asset;
    }) && exerciseById('squat')?.video?.asset === 'assets/coach-videos/coach-homme-squat-v2.mp4' && exerciseById('planche')?.video?.asset === 'assets/coach-videos/coach-femme-planche-v2.mp4',
  );
  for (const minutes of SESSION_MINUTES) {
    for (const level of SESSION_LEVELS) {
      for (const audience of SESSION_AUDIENCES) {
        const plan = buildProgressiveSession({ minutes, level, audience, coachId: 'coach-asie' });
        const covered = new Set(plan.blocks.filter((block) => block.phase !== 'retour').map((block) => block.area));
        const close = plan.totalSec <= minutes * 60 && plan.totalSec >= minutes * 60 - 55;
        check(
          `${audience} ${level} ${minutes} min couvre les zones et la durée`,
          close && areas.every((area) => covered.has(area as BodyPartId)) && plan.blocks.length >= 7,
        );
      }
    }
  }
  const squat = exerciseById('squat');
  if (squat) {
    const withTemps: LibraryExercise = {
      ...squat,
      videoSlow: { coachId: 'coach-homme', asset: videoAssetPath('squat', 'coach-homme', 'lent') },
      videoIntense: { coachId: 'coach-homme', url: 'https://example.com/squat-intense.mp4' },
    };
    const slow = clipCandidates(withTemps, 'echauffement', 'coach-homme');
    const climb = clipCandidates(withTemps, 'montee', 'coach-homme');
    const hard = clipCandidates(withTemps, 'intense', 'coach-homme');
    const calm = clipCandidates(withTemps, 'retour', 'coach-homme');
    check('échauffement prend le clip lent', slow[0]?.asset === videoAssetPath('squat', 'coach-homme', 'lent'));
    check('montée prend aussi le clip lent', climb[0]?.asset === slow[0]?.asset);
    check('retour prend le clip lent', calm[0]?.asset === slow[0]?.asset);
    check('intense prend le clip intense', hard[0]?.url === 'https://example.com/squat-intense.mp4');
    const bundled = new Set([squat.video?.asset ?? '', videoAssetPath('squat', 'coach-homme', 'lent')]);
    const playedSlow = pickClip(slow, (asset) => bundled.has(asset));
    const missingSlow = pickClip(clipCandidates(squat, 'montee', 'coach-homme'), (asset) => asset === squat.video?.asset);
    const missingAll = pickClip(clipCandidates(squat, 'intense', 'coach-femme'), () => false);
    check('clip lent joué s’il est dans le bundle', playedSlow?.asset === videoAssetPath('squat', 'coach-homme', 'lent'));
    check('sans clip lent, la vidéo unique', missingSlow?.asset === squat.video?.asset);
    check('sans vidéo pour ce coach, pas de clip', missingAll === null);
  } else {
    check('squat présent', false);
  }
  check('noms de fichiers lent et intense', videoFileName('planche', 'coach-femme', 'lent') === 'planche-coach-femme-lent.mp4' && videoFileName('planche', 'coach-femme', 'intense') === 'planche-coach-femme-intense.mp4' && videoFileName('grenouille', 'coach-papa-garcon') === 'grenouille-coach-papa-garcon.mp4');
  const offlineOnly = pickClip(
    [{ asset: null, url: 'https://example.com/only.mp4' }, { asset: 'assets/coach-videos/coach-homme-squat-v2.mp4', url: null }],
    (asset) => asset.endsWith('coach-homme-squat-v2.mp4'),
    { online: false },
  );
  check('hors ligne : on saute l’URL et on garde le clip local', offlineOnly?.asset === 'assets/coach-videos/coach-homme-squat-v2.mp4');
  check('hors ligne sans fichier local : pas de clip', pickClip([{ asset: null, url: 'https://example.com/only.mp4' }], () => false, { online: false }) === null);
  check('en ligne, l’URL distante reste possible', pickClip([{ asset: null, url: 'https://example.com/only.mp4' }], () => false)?.url === 'https://example.com/only.mp4');
  const started = initialPlayClock(adult.blocks);
  check('le minuteur part sur le premier travail', started.mode === 'work' && started.running && started.left === adult.blocks[0]?.workSec);
  const afterWork = tickPlayClock({ ...started, left: 1 }, adult.blocks);
  check('la fin d’un travail ouvre le repos', afterWork.mode === 'rest' && afterWork.left === adult.blocks[0]?.restSec);
  check('une seconde avant la fin ne change pas de bloc', tickPlayClock({ ...started, left: 2 }, adult.blocks).left === 1);
  check('séance vide : pas de journal', initialPlayClock([]).mode === 'done' && !shouldRecordWorkout(0, 'done'));
  check('séance en cours : pas de journal', !shouldRecordWorkout(adult.blocks.length, 'work'));
  check('séance terminée : journal', shouldRecordWorkout(adult.blocks.length, 'done'));
  check('pause : le tick ne termine pas la séance', tickPlayClock({ ...started, running: false }, adult.blocks).running === false && tickPlayClock({ ...started, running: false }, adult.blocks).mode === 'work');
  return out;
}
