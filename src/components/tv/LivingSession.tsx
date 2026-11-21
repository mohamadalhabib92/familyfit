import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { CueCard } from '@/components/moves/CueCard';
import { DemoStage } from '@/components/moves/DemoStage';
import { IntensityBar } from '@/components/moves/IntensityBar';
import { videoModule } from '@/components/moves/media';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import { BODY_PARTS, exerciseById, rosterById } from '@/lib/coachLibrary';
import type { PlayParams } from '@/lib/homePractice';
import { translate, type CopyKey } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import { TV_SAFE, tvSafeSize, workoutColumns } from '@/lib/tvSurface';
import {
  buildProgressiveSession, clipCandidates, elapsedBefore, pickClip,
  type IntensityPhase, type SessionBlock,
} from '@/lib/progression';
import { formatClock, wholeSeconds } from '@/lib/workoutEngine';
import { theme as t } from '@/ui/theme';

type Clock = { index: number; mode: 'work' | 'rest' | 'done'; left: number; running: boolean };

function advance(state: Clock, blocks: SessionBlock[]): Clock {
  const block = blocks[state.index];
  if (!block) return { ...state, mode: 'done', running: false, left: 0 };
  if (state.mode === 'work' && block.restSec > 0) return { ...state, mode: 'rest', left: block.restSec };
  const next = state.index + 1;
  const following = blocks[next];
  if (!following) return { ...state, mode: 'done', running: false, left: 0 };
  return { ...state, index: next, mode: 'work', left: following.workSec };
}

function tick(state: Clock, blocks: SessionBlock[]): Clock {
  if (!state.running || state.mode === 'done') return state;
  if (state.left > 1) return { ...state, left: state.left - 1 };
  return advance(state, blocks);
}

/** Séance plein écran. La vidéo du coach occupe la grande colonne. L’échauffement ne se saute pas : il n’y a pas de bouton pour ça. */
export function LivingSession({ params, onBack, onComplete }: { params: PlayParams; onBack: () => void; onComplete: (durationSec: number) => void }) {
  const { prefs } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const window = useWindowDimensions();
  const safe = tvSafeSize(window);
  const frame = workoutColumns(window);
  const session = useMemo(
    () => buildProgressiveSession({
      minutes: Number(params.minutes) as 10 | 15 | 20 | 30,
      level: params.level,
      audience: params.audience,
      coachId: params.coach,
    }),
    [params.audience, params.coach, params.level, params.minutes],
  );
  const [clock, setClock] = useState<Clock>({ index: 0, mode: 'work', left: session.blocks[0]?.workSec ?? 0, running: true });
  const logged = useRef(false);

  useEffect(() => {
    if (!clock.running || clock.mode === 'done') return undefined;
    const id = setInterval(() => setClock((state) => tick(state, session.blocks)), 1000);
    return () => clearInterval(id);
  }, [clock.running, clock.mode, clock.index, session.blocks]);

  useEffect(() => {
    if (clock.mode !== 'done' || logged.current || !session.blocks.length) return;
    logged.current = true;
    onComplete(wholeSeconds(session.totalSec));
  }, [clock.mode, onComplete, session.blocks.length, session.totalSec]);

  useEffect(() => {
    if (!isTv()) return undefined;
    let release = () => {};
    try {
      const keep = require('expo-keep-awake') as {
        activateKeepAwakeAsync?: (tag?: string) => Promise<void>;
        deactivateKeepAwake?: (tag?: string) => void | Promise<void>;
      };
      const tag = 'familyfit-tv-salon';
      void keep.activateKeepAwakeAsync?.(tag)?.catch(() => undefined);
      release = () => {
        try { void Promise.resolve(keep.deactivateKeepAwake?.(tag)).catch(() => undefined); } catch { /* déjà libre */ }
      };
    } catch { /* la séance continue */ }
    return release;
  }, []);

  const phases: Record<IntensityPhase, string> = {
    echauffement: copy('seance.echauffement'),
    montee: copy('seance.montee'),
    intense: copy('seance.intense'),
    retour: copy('seance.retour'),
  };
  const block = session.blocks[clock.index];
  const exercise = block ? exerciseById(block.exerciseId) : undefined;
  const nextBlock = session.blocks[clock.index + 1];
  const nextExercise = nextBlock ? exerciseById(nextBlock.exerciseId) : undefined;
  const coach = rosterById(session.coachId);
  const area = BODY_PARTS.find((part) => part.id === block?.area)?.title ?? '';
  const prior = elapsedBefore(session.blocks, clock.mode === 'done' ? session.blocks.length : clock.index);
  const into = !block || clock.mode === 'done' ? 0 : clock.mode === 'work' ? block.workSec - clock.left : block.workSec + (block.restSec - clock.left);
  const fill = session.totalSec ? Math.min(1, (prior + into) / session.totalSec) : 0;
  const clip = exercise && block && clock.mode === 'work'
    ? pickClip(clipCandidates(exercise, block.phase, session.coachId), (asset) => videoModule(asset) != null)
    : null;
  const videoHeight = Math.max(420, safe.height - 8);
  const playerCopy = { play: copy('moves.play'), pause: copy('moves.pause'), mute: copy('moves.mute'), sound: copy('moves.sound') };
  const left = wholeSeconds(clock.left);

  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: frame.gap, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical }}>
      <ScrollView style={{ width: frame.leftWidth }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 16 }}>
        {clock.mode === 'done' || !block || !exercise ? (
          <View style={{ gap: 12 }}>
            <TvText size={48} weight="800">{copy('seance.done')}</TvText>
            <TvText size={26} color={t.muted}>{copy('seance.doneLead')}</TvText>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <TvText size={22} color={t.muted}>{phases[block.phase]} · {area}</TvText>
            <TvText size={Math.min(120, Math.round(safe.height * 0.16))} weight="800">{formatClock(left)}</TvText>
            <TvText size={36} weight="800">{exercise.name}</TvText>
            <TvText size={28} weight="800">{exercise.dose}</TvText>
            <TvText size={24} color={t.muted}>{clock.mode === 'rest' ? copy('seance.rest') : copy('seance.work')} · {coach.nameFr}</TvText>
            {nextExercise ? <TvText size={22} color={t.muted}>{copy('tv.nextMove')} · {nextExercise.name}</TvText> : null}
          </View>
        )}
        <IntensityBar phase={block && clock.mode !== 'done' ? block.phase : 'retour'} fill={clock.mode === 'done' ? 1 : fill} labels={phases} detail={copy('home.arc')} />
        <View style={{ gap: 16 }}>
          {clock.mode === 'done' ? (
            <TvFocusable preferred label={copy('moves.back')} onPress={onBack} style={{ minHeight: 88 }}>
              <TvText size={32} weight="800">{copy('moves.back')}</TvText>
            </TvFocusable>
          ) : (
            <>
              <TvFocusable preferred label={clock.running ? copy('player.pause') : copy('player.resume')} onPress={() => setClock((state) => ({ ...state, running: !state.running }))} style={{ minHeight: 88 }}>
                <TvText size={32} weight="800">{clock.running ? copy('player.pause') : copy('player.resume')}</TvText>
              </TvFocusable>
              <TvFocusable label={copy('seance.next')} onPress={() => setClock((state) => advance(state, session.blocks))} style={{ minHeight: 80 }}>
                <TvText size={28} weight="800">{copy('seance.next')}</TvText>
              </TvFocusable>
            </>
          )}
        </View>
      </ScrollView>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {exercise && clock.mode !== 'done' && clip && (videoModule(clip.asset) != null || clip.url) ? (
          <DemoStage asset={clip.asset} url={clip.url} title={exercise.name} copy={playerCopy} height={videoHeight} preferPlay={false} quiet />
        ) : exercise && clock.mode !== 'done' ? (
          <CueCard coach={coach} steps={exercise.steps} width={Math.max(480, frame.rightWidth - 12)} />
        ) : (
          <TvText size={42} weight="800">{copy('seance.done')}</TvText>
        )}
      </View>
    </View>
  );
}
