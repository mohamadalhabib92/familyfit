import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { OfflineNote, useOffline } from '@/components/OfflineNote';
import { IntensityBar } from '@/components/moves/IntensityBar';
import { CueCard } from '@/components/moves/CueCard';
import { DemoStage } from '@/components/moves/DemoStage';
import { videoModule } from '@/components/moves/media';
import { TvFocusable, TvScreen, TvText } from '@/components/tv/focus';
import { useTvMenu } from '@/components/tv/useTvMenu';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { exerciseById, rosterById, rosterCoachId, BODY_PARTS } from '@/lib/coachLibrary';
import { pulseLight, shouldPulse } from '@/lib/haptics';
import { translate, type CopyKey } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import { uid } from '@/lib/storage';
import {
  advancePlayClock, buildProgressiveSession, clipCandidates, elapsedBefore, initialPlayClock, isSessionLevel, isSessionMinutes, pickClip, shouldRecordWorkout, tickPlayClock,
  type IntensityPhase, type PlayClock, type Tempo,
} from '@/lib/progression';
import { TV_SAFE } from '@/lib/tvSurface';
import { Button, Card, Empty, H1, Muted, Row, Screen } from '@/ui/kit';
import { useReduceMotion } from '@/ui/motion';
import { useHapticsEnabled } from '@/ui/ThemeProvider';
import { theme as t } from '@/ui/theme';

export default function ProgressivePlayer() {
  const router = useRouter();
  const params = useLocalSearchParams<{ minutes?: string; level?: string; audience?: string; coach?: string }>();
  const { prefs, me, logWorkout } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const tv = isTv();
  const window = useWindowDimensions();
  const minutes = isSessionMinutes(params.minutes) ? Number(params.minutes) as 10 | 15 | 20 | 30 : 20;
  const level = isSessionLevel(params.level) ? params.level : 'intermediaire';
  const audience = params.audience === 'famille' ? 'famille' : 'adulte';
  const coachId = rosterCoachId(params.coach, audience === 'famille' ? 'coach-papa-garcon' : 'coach-homme');
  const session = useMemo(
    () => buildProgressiveSession({ minutes, level, audience, coachId }),
    [minutes, level, audience, coachId],
  );
  const offline = useOffline();
  const hapticsOn = useHapticsEnabled();
  const reduce = useReduceMotion();
  const [clock, setClock] = useState<PlayClock>(() => initialPlayClock(session.blocks));
  const logged = useRef(false);
  useEffect(() => {
    if (!shouldRecordWorkout(session.blocks.length, clock.mode) || logged.current) return;
    logged.current = true;
    logWorkout({
      id: uid('wo_'),
      routineId: `seance-${audience}-${minutes}`,
      // Le journal ne connaît que Lina, Noor, Pico et Sami. Le nom de la séance porte l’audience.
      coachId: 'lina',
      memberIds: me ? [me.id] : [],
      date: todayISO(),
      completedAt: new Date().toISOString(),
      durationSec: session.totalSec,
      warmupCompleted: true,
      together: audience === 'famille' && Boolean(me),
    });
  }, [audience, clock.mode, logWorkout, me, minutes, session.blocks.length, session.totalSec]);
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/moves');
  };
  useTvMenu(tv, 'session', back);

  useEffect(() => {
    if (!clock.running || clock.mode === 'done') return undefined;
    const id = setInterval(() => setClock((state) => tickPlayClock(state, session.blocks)), 1000);
    return () => clearInterval(id);
  }, [clock.running, clock.mode, clock.index, session.blocks]);
  const phaseKey = `${clock.index}:${clock.mode}`;
  const pulsed = useRef<string | null>(null);
  useEffect(() => {
    if (pulsed.current === null) {
      pulsed.current = phaseKey;
      return;
    }
    if (pulsed.current === phaseKey) return;
    pulsed.current = phaseKey;
    if (clock.mode === 'work' && shouldPulse(hapticsOn, tv, reduce)) pulseLight();
  }, [clock.mode, hapticsOn, phaseKey, reduce, tv]);

  const phaseLabel: Record<IntensityPhase, string> = {
    echauffement: copy('seance.echauffement'),
    montee: copy('seance.montee'),
    intense: copy('seance.intense'),
    retour: copy('seance.retour'),
  };
  const tempoLabel: Record<Tempo, string> = {
    lent: copy('seance.lent'),
    modere: copy('seance.modere'),
    rapide: copy('seance.rapide'),
  };
  const block = session.blocks[clock.index];
  const exercise = block ? exerciseById(block.exerciseId) : undefined;
  const coach = rosterById(session.coachId);
  const area = BODY_PARTS.find((part) => part.id === block?.area)?.title ?? '';
  const prior = elapsedBefore(session.blocks, clock.mode === 'done' ? session.blocks.length : clock.index);
  const into = !block || clock.mode === 'done'
    ? 0
    : clock.mode === 'work'
      ? block.workSec - clock.left
      : block.workSec + (block.restSec - clock.left);
  const fill = session.totalSec ? Math.min(1, (prior + into) / session.totalSec) : 0;
  const clip = exercise && block && clock.mode === 'work'
    ? pickClip(clipCandidates(exercise, block.phase, session.coachId), (asset) => videoModule(asset) != null, { online: !offline })
    : null;
  const detail = !block || clock.mode === 'done'
    ? copy('seance.done')
    : `${phaseLabel[block.phase]} · ${tempoLabel[block.tempo]} · ${clock.left} s`;
  const videoHeight = tv ? Math.max(280, Math.round(window.height * 0.42)) : 220;
  const playerCopy = { play: copy('moves.play'), pause: copy('moves.pause'), mute: copy('moves.mute'), sound: copy('moves.sound'), unavailable: copy('moves.videoFailed') };
  const timerLabel = `${clock.left} secondes, ${clock.mode === 'rest' ? copy('seance.rest') : copy('seance.work')}`;

  if (!session.blocks.length) {
    const missing = (
      <View style={{ gap: 12 }}>
        <OfflineNote tv={tv} />
        <Empty icon="alert-circle-outline" title={copy('moves.missing')} text={copy('moves.lead')} action={tv ? undefined : <Button title={copy('moves.back')} onPress={back} />} />
        {tv ? (
          <TvFocusable preferred label={copy('moves.back')} onPress={back}>
            <TvText size={28} weight="800">{copy('moves.back')}</TvText>
          </TvFocusable>
        ) : null}
      </View>
    );
    if (tv) {
      return (
        <TvScreen>
          <Stack.Screen options={{ headerShown: false }} />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical }}>{missing}</ScrollView>
        </TvScreen>
      );
    }
    return (
      <Screen>
        <Stack.Screen options={{ title: copy('seance.title') }} />
        {missing}
      </Screen>
    );
  }

  const body = (
    <View style={{ gap: tv ? 18 : 12 }}>
      <OfflineNote tv={tv} />
      <IntensityBar phase={block && clock.mode !== 'done' ? block.phase : 'retour'} fill={clock.mode === 'done' ? 1 : fill} labels={phaseLabel} detail={detail} />
      {clock.mode === 'done' || !block || !exercise ? (
        <View style={{ gap: 8 }}>
          {tv ? <TvText size={48} weight="800">{copy('seance.done')}</TvText> : <H1>{copy('seance.done')}</H1>}
          {tv ? <TvText size={24} color={t.muted}>{copy('seance.doneLead')}</TvText> : <Muted>{copy('seance.doneLead')}</Muted>}
          {tv ? <TvText size={22} color={t.text}>{copy('health.disclaimer')}</TvText> : <Muted>{copy('health.disclaimer')}</Muted>}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {tv ? <TvText size={40} weight="800">{exercise.name}</TvText> : <H1>{exercise.name}</H1>}
          {tv ? <TvText size={24} color={t.muted}>{`${area} · ${coach.nameFr}`}</TvText> : <Muted>{`${area} · ${coach.nameFr}`}</Muted>}
          {tv ? <TvText size={28} weight="800">{exercise.dose}</TvText> : <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>{exercise.dose}</Text>}
          <View accessibilityRole="timer" accessibilityLabel={timerLabel}>
            {tv ? <TvText size={72} weight="800">{String(clock.left)}</TvText> : <Text style={{ color: t.text, fontSize: 56, fontWeight: '800' }}>{clock.left}</Text>}
          </View>
          {tv ? <TvText size={28}>{clock.mode === 'rest' ? copy('seance.rest') : copy('seance.work')}</TvText> : <Muted>{clock.mode === 'rest' ? copy('seance.rest') : copy('seance.work')}</Muted>}
          {tv ? <TvText size={22} color={t.muted}>{copy('home.reps')}</TvText> : <Muted>{copy('home.reps')}</Muted>}
          {clock.mode === 'work' && clip && (videoModule(clip.asset) != null || clip.url) ? (
            <DemoStage asset={clip.asset} url={clip.url} title={exercise.name} copy={playerCopy} height={videoHeight} preferPlay={false} />
          ) : (
            <View style={{ gap: 8 }}>
              {clock.mode === 'work' ? (tv ? <TvText size={22} color={t.muted}>{copy('moves.noVideo')}</TvText> : <Muted>{copy('moves.noVideo')}</Muted>) : <Muted>{exercise.safety[0]}</Muted>}
              <CueCard coach={coach} steps={exercise.steps} width={tv ? 640 : Math.min(560, window.width - 48)} />
            </View>
          )}
        </View>
      )}
      <View style={{ flexDirection: tv ? 'row' : 'column', gap: 12 }}>
        {clock.mode === 'done' ? (
          tv ? (
            <TvFocusable preferred label={copy('moves.back')} onPress={back} style={{ flex: 1 }}>
              <TvText size={28} weight="800">{copy('moves.back')}</TvText>
            </TvFocusable>
          ) : (
            <Button title={copy('moves.back')} onPress={back} />
          )
        ) : tv ? (
          <>
            <TvFocusable preferred label={clock.running ? copy('seance.hold') : copy('seance.resume')} onPress={() => setClock((state) => ({ ...state, running: !state.running }))} style={{ flex: 1 }}>
              <TvText size={28} weight="800">{clock.running ? copy('seance.hold') : copy('seance.resume')}</TvText>
            </TvFocusable>
            <TvFocusable label={copy('seance.next')} onPress={() => setClock((state) => advancePlayClock(state, session.blocks))} style={{ flex: 1 }}>
              <TvText size={28} weight="800">{copy('seance.next')}</TvText>
            </TvFocusable>
          </>
        ) : (
          <Row gap={12}>
            <Button title={clock.running ? copy('seance.hold') : copy('seance.resume')} icon={clock.running ? 'pause' : 'play'} onPress={() => setClock((state) => ({ ...state, running: !state.running }))} style={{ flex: 1 }} />
            <Button variant="secondary" title={copy('seance.next')} icon="chevron-forward" onPress={() => setClock((state) => advancePlayClock(state, session.blocks))} style={{ flex: 1 }} />
          </Row>
        )}
      </View>
      {block && exercise && clock.mode !== 'done' ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: tv ? 22 : 16 }}>{copy('moves.safety')}</Text>
          {exercise.safety.map((line) => (
            <Text key={line} style={{ color: t.text, fontSize: tv ? 20 : 15, lineHeight: tv ? 28 : 21 }}>{line}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (tv) {
    return (
      <TvScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical, gap: 8 }}>{body}</ScrollView>
      </TvScreen>
    );
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: copy('seance.title') }} />
      <Card>{body}</Card>
    </Screen>
  );
}
