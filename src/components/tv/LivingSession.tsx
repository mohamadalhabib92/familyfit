import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CueCard } from '@/components/moves/CueCard';
import { DemoStage } from '@/components/moves/DemoStage';
import { IntensityBar } from '@/components/moves/IntensityBar';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import { rosterById } from '@/lib/coachLibrary';
import type { PlayParams } from '@/lib/homePractice';
import { translate, type CopyKey } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import { pauseNativeClock, readClockMs, resumeNativeClock, seekNativeClock, speakCue, startNativeClock, stopCue } from '../../../modules/familyfit-session/src/index';
import { TV_SAFE, tvSafeSize, workoutColumns } from '@/lib/tvSurface';
import {
  chooseToday, cuesBetween, frameAt, routineKey, type Level, type ProgramMinutes,
} from '@/lib/training/engine';
import { formatClock } from '@/lib/workoutEngine';
import { practiceStreak } from '@/lib/homePractice';
import { theme as t } from '@/ui/theme';
import type { IntensityPhase } from '@/lib/progression';

/** Séance plein écran. La vidéo reste dans la grande colonne. L’horloge unique aligne le geste, la voix et les répétitions. */
export function LivingSession({ params, onBack, onComplete }: { params: PlayParams; onBack: () => void; onComplete: (durationSec: number, info?: { routineId: string }) => void }) {
  const { prefs, fitness } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const locale = prefs.locale === 'en' ? 'en' : 'fr';
  const window = useWindowDimensions();
  const safe = tvSafeSize(window);
  const frame = workoutColumns(window);
  const level: Level = params.level === 'avance' ? 'avance' : params.level === 'debutant' ? 'debutant' : 'intermediaire';
  const minutes = (Number(params.minutes) === 10 || Number(params.minutes) === 15 || Number(params.minutes) === 20 || Number(params.minutes) === 30 || Number(params.minutes) === 45
    ? Number(params.minutes)
    : 20) as ProgramMinutes;
  const workout = useMemo(
    () => chooseToday({
      today: new Date().toISOString().slice(0, 10),
      logs: fitness.logs.map((log) => ({ routineId: log.routineId, date: log.date })),
      audience: params.audience === 'famille' ? 'famille' : 'adulte',
      level,
      minutes,
    }),
    [fitness.logs, level, minutes, params.audience],
  );
  const [mediaMs, setMediaMs] = useState(0);
  const [running, setRunning] = useState(true);
  const logged = useRef(false);
  const spoken = useRef(-1);
  const anchor = useRef({ t0: Date.now(), media: 0, running: true });

  useEffect(() => {
    startNativeClock();
    const id = setInterval(() => {
      const native = readClockMs();
      if (native != null) {
        setMediaMs(native);
        return;
      }
      const point = anchor.current;
      setMediaMs(point.running ? point.media + (Date.now() - point.t0) : point.media);
    }, 50);
    return () => {
      clearInterval(id);
      stopCue();
    };
  }, []);

  const view = frameAt(workout, mediaMs, locale);
  const coach = rosterById(params.audience === 'famille' ? 'coach-papa-garcon' : 'coach-afrique-ouest');

  useEffect(() => {
    if (!running) return;
    const due = cuesBetween(workout, spoken.current, mediaMs);
    spoken.current = mediaMs;
    due.forEach((cue) => speakCue(cue[locale], cue.speaker, locale));
  }, [locale, mediaMs, running, workout]);

  useEffect(() => {
    if (!view.done || logged.current) return;
    logged.current = true;
    stopCue();
    onComplete(Math.round(workout.minutes * 60), { routineId: routineKey(workout) });
  }, [onComplete, view.done, workout]);

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
  const fill = workout.minutes > 0 ? Math.min(1, mediaMs / (workout.minutes * 60_000)) : 0;
  const phaseKey: IntensityPhase = view.segment?.phase === 'warmup' ? 'echauffement' : view.segment?.phase === 'cooldown' ? 'retour' : fill < 0.55 ? 'montee' : 'intense';
  const videoHeight = Math.max(420, safe.height - 8);
  const playerCopy = { play: copy('moves.play'), pause: copy('moves.pause'), mute: copy('moves.mute'), sound: copy('moves.sound') };
  const asset = view.segment?.video.asset ?? null;
  const previous = workout.segments[Math.max(0, workout.segments.findIndex((item) => item.id === view.segment?.id) - 1)];
  const showUnder = view.segment?.role === 'transition' ? previous?.video.asset ?? null : null;
  const title = view.exercise?.name[locale] ?? workout.title[locale];
  const pause = () => {
    const ms = pauseNativeClock() ?? mediaMs;
    anchor.current = { t0: Date.now(), media: ms, running: false };
    setRunning(false);
    setMediaMs(ms);
  };
  const resume = () => {
    resumeNativeClock();
    anchor.current = { t0: Date.now(), media: mediaMs, running: true };
    setRunning(true);
  };
  const skipToNext = () => {
    const index = workout.segments.findIndex((item) => item.id === view.segment?.id);
    const next = workout.segments[index + 1];
    if (!next) return;
    seekNativeClock(next.startMs);
    anchor.current = { ...anchor.current, t0: Date.now(), media: next.startMs };
    spoken.current = next.startMs;
    setMediaMs(next.startMs);
  };
  const streak = practiceStreak(fitness.logs, new Date().toISOString().slice(0, 10));

  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: frame.gap, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical }}>
      <ScrollView style={{ width: frame.leftWidth }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 16 }}>
        {view.done ? (
          <View style={{ gap: 12 }}>
            <TvText size={48} weight="800">{copy('seance.done')}</TvText>
            <TvText size={28} weight="800">{copy('tv.summary')}</TvText>
            <TvText size={26} color={t.text}>{formatClock(workout.minutes * 60)}</TvText>
            <TvText size={24} color={t.text}>{workout.zones.join(' · ')}</TvText>
            {workout.exercises.map((item) => (
              <TvText key={item.id} size={22} color={t.text}>{item.name[locale]}</TvText>
            ))}
            <TvText size={26} weight="800">{streak} {copy('train.days')}</TvText>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TvText size={22} color={t.muted}>{phases[phaseKey]} · {view.exercise?.zone}</TvText>
            <RoundTimer seconds={Math.ceil(view.remainingMs / 1000)} progress={view.progress} size={Math.min(220, frame.leftWidth - 24)} />
            <TvText size={36} weight="800">{title}</TvText>
            {view.segment?.role === 'work' ? (
              <TvText size={32} weight="800">{copy('tv.reps')} {view.reps.current}/{view.reps.target}</TvText>
            ) : (
              <TvText size={28} weight="800">{copy('seance.rest')}</TvText>
            )}
            <TvText size={22} color={t.text}>{view.exercise?.cues[locale][0]}</TvText>
            <TvText size={22} color={t.muted}>{copy('tv.easier')} · {view.easier}</TvText>
            {view.nextExercise ? <TvText size={22} color={t.muted}>{copy('tv.nextMove')} · {view.nextExercise.name[locale]}</TvText> : null}
          </View>
        )}
        <IntensityBar phase={phaseKey} fill={view.done ? 1 : fill} labels={phases} detail={workout.title[locale]} />
        <View style={{ gap: 16 }}>
          {view.done ? (
            <TvFocusable preferred label={copy('moves.back')} onPress={onBack} style={{ minHeight: 88 }}>
              <TvText size={32} weight="800">{copy('moves.back')}</TvText>
            </TvFocusable>
          ) : (
            <>
              <TvFocusable preferred label={running ? copy('player.pause') : copy('player.resume')} onPress={running ? pause : resume} style={{ minHeight: 88 }}>
                <TvText size={32} weight="800">{running ? copy('player.pause') : copy('player.resume')}</TvText>
              </TvFocusable>
              <TvFocusable label={copy('seance.next')} onPress={skipToNext} style={{ minHeight: 80 }}>
                <TvText size={28} weight="800">{copy('seance.next')}</TvText>
              </TvFocusable>
            </>
          )}
        </View>
      </ScrollView>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {showUnder ? (
          <View style={{ opacity: 1 - view.progress }}>
            <DemoStage asset={showUnder} url={null} title={title} copy={playerCopy} height={videoHeight} preferPlay={false} quiet hold={!running} syncMs={null} />
          </View>
        ) : null}
        {asset ? (
          <View style={showUnder ? { position: 'absolute', left: 0, right: 0, opacity: view.segment?.role === 'transition' ? view.progress : 1 } : undefined}>
            <DemoStage asset={asset} url={null} title={title} copy={playerCopy} height={videoHeight} preferPlay={false} quiet hold={!running} syncMs={view.segment?.role === 'work' ? view.videoMs : null} />
          </View>
        ) : view.exercise ? (
          <CueCard coach={coach} steps={view.exercise.cues[locale]} width={Math.max(480, frame.rightWidth - 12)} />
        ) : (
          <TvText size={42} weight="800">{copy('seance.done')}</TvText>
        )}
      </View>
    </View>
  );
}

function RoundTimer({ seconds, progress, size }: { seconds: number; progress: number; size: number }) {
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = circ * Math.max(0, Math.min(1, 1 - progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={t.border} strokeWidth={12} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={t.accent}
          strokeWidth={12}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dash}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      </View>
      <TvText size={Math.round(size * 0.28)} weight="800">{formatClock(seconds)}</TvText>
    </View>
  );
}
