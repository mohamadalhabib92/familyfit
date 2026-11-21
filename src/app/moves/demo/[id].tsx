import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { CoachPicker } from '@/components/moves/CoachPicker';
import { videoModule } from '@/components/moves/media';
import { CueCard } from '@/components/moves/CueCard';
import { DemoStage } from '@/components/moves/DemoStage';
import { MovesFrame } from '@/components/moves/MovesFrame';
import { TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import {
  exerciseById, resolveDemo, rosterById, rosterCoachId, LEVEL_LABEL, type RosterCoachId,
} from '@/lib/coachLibrary';
import { translate, type CopyKey } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import { workoutColumns } from '@/lib/tvSurface';
import { Card, Empty, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function ExerciseDemo() {
  const { id, coach } = useLocalSearchParams<{ id: string; coach?: string }>();
  const exercise = exerciseById(String(id));
  const { prefs } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const fallback: RosterCoachId = exercise?.bodyPart === 'enfants' ? 'coach-papa-garcon' : exercise?.coachId ?? 'coach-homme';
  const [coachId, setCoachId] = useState<RosterCoachId>(rosterCoachId(coach, fallback));
  const tv = isTv();
  const window = useWindowDimensions();
  if (!exercise) {
    return (
      <MovesFrame title={copy('moves.title')} backLabel={copy('moves.back')}>
        <Empty icon="search-outline" title={copy('moves.missing')} text={copy('moves.lead')} />
      </MovesFrame>
    );
  }
  const demo = resolveDemo(exercise, coachId);
  const bundled = demo.kind === 'video' ? videoModule(demo.asset) : null;
  const playable = demo.kind === 'video' && (bundled != null || !!demo.url);
  const shown = rosterById(demo.coachId);
  const stageWidth = tv ? Math.max(480, workoutColumns(window).rightWidth - 24) : Math.min(640, window.width - 48);
  const playerCopy = { play: copy('moves.play'), pause: copy('moves.pause'), mute: copy('moves.mute'), sound: copy('moves.sound'), unavailable: copy('moves.videoFailed') };
  const stage = playable && demo.kind === 'video'
    ? <DemoStage asset={demo.asset} url={demo.url} title={exercise.name} copy={playerCopy} />
    : (
      <View style={{ gap: 12 }}>
        {tv ? <TvText size={22} color={t.muted}>{copy('moves.noVideo')}</TvText> : <Muted>{copy('moves.noVideo')}</Muted>}
        <CueCard coach={shown} steps={demo.kind === 'cues' ? demo.steps : exercise.steps} width={Math.min(stageWidth, 720)} />
      </View>
    );
  const facts = (
    <View style={{ gap: 8 }}>
      {tv ? <TvText size={22} color={t.muted}>{`${LEVEL_LABEL[exercise.level]} · ${exercise.dose}`}</TvText> : <Muted>{`${LEVEL_LABEL[exercise.level]} · ${exercise.dose}`}</Muted>}
      {tv ? <TvText size={22} color={t.muted}>{`${shown.nameFr} · ${shown.role}`}</TvText> : <Muted>{`${shown.nameFr} · ${shown.role}`}</Muted>}
      {shown.kids ? (tv ? <TvText size={22} color={t.muted}>{copy('moves.withPapa')}</TvText> : <Muted>{copy('moves.withPapa')}</Muted>) : null}
      <Text style={{ color: t.text, fontWeight: '700', fontSize: tv ? 26 : 16 }}>{copy('moves.safety')}</Text>
      {exercise.safety.map((line) => (
        tv
          ? <TvText key={line} size={22} color={t.text}>{line}</TvText>
          : <Text key={line} style={{ color: t.text, fontSize: 16, lineHeight: 22 }}>{line}</Text>
      ))}
    </View>
  );
  return (
    <MovesFrame title={exercise.name} subtitle={shown.bio} backLabel={copy('moves.back')}>
      {tv ? (
        <View style={{ gap: 22 }}>
          {stage}
          {facts}
          <CoachPicker selected={coachId} onSelect={setCoachId} label={copy('moves.coach')} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Card>{stage}</Card>
          <Card>{facts}</Card>
          <CoachPicker selected={coachId} onSelect={setCoachId} label={copy('moves.coach')} />
        </View>
      )}
    </MovesFrame>
  );
}
