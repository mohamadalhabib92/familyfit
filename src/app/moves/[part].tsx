import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { CoachPicker } from '@/components/moves/CoachPicker';
import { MovesFrame } from '@/components/moves/MovesFrame';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import {
  bodyPartById, exercisesFor, resolveDemo, rosterCoachId, LEVEL_LABEL,
  type BodyPartId, type RosterCoachId,
} from '@/lib/coachLibrary';
import { translate, type CopyKey } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import { claimsPreferredFocus, profileGrid } from '@/lib/tvSurface';
import { Card, Empty, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function ExerciseList() {
  const { part: partParam, coach } = useLocalSearchParams<{ part: string; coach?: string }>();
  const part = bodyPartById(String(partParam));
  const router = useRouter();
  const { prefs } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const fallback: RosterCoachId = part?.id === 'enfants' ? 'coach-papa-garcon' : 'coach-homme';
  const [coachId, setCoachId] = useState<RosterCoachId>(rosterCoachId(coach, fallback));
  const tv = isTv();
  const window = useWindowDimensions();
  if (!part) {
    return (
      <MovesFrame title={copy('moves.title')} backLabel={copy('moves.back')}>
        <Empty icon="search-outline" title={copy('moves.missing')} text={copy('moves.lead')} />
      </MovesFrame>
    );
  }
  const rows = exercisesFor(part.id as BodyPartId);
  const grid = profileGrid(window, rows.length);
  const open = (id: string) => {
    router.push({ pathname: '/moves/demo/[id]', params: { id, coach: coachId } });
  };
  return (
    <MovesFrame title={part.title} subtitle={part.id === 'enfants' ? copy('moves.kidsNote') : part.blurb} backLabel={copy('moves.back')}>
      <CoachPicker selected={coachId} onSelect={setCoachId} label={copy('moves.coach')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tv ? grid.gap : 12 }}>
        {rows.map((exercise, index) => {
          const demo = resolveDemo(exercise, coachId);
          const detail = `${LEVEL_LABEL[exercise.level]} · ${exercise.dose}`;
          if (tv) {
            return (
              <TvFocusable
                key={exercise.id}
                preferred={claimsPreferredFocus('profile', index)}
                label={`${exercise.name}. ${detail}`}
                onPress={() => open(exercise.id)}
                style={{ width: grid.cardWidth, minHeight: 150 }}
              >
                <TvText size={30} weight="800">{exercise.name}</TvText>
                <TvText size={20} color={t.muted}>{detail}</TvText>
                {demo.kind === 'video' ? <TvText size={18} weight="700" color={t.primary}>{copy('moves.video')}</TvText> : null}
              </TvFocusable>
            );
          }
          return (
            <Card key={exercise.id} onPress={() => open(exercise.id)} accessibilityLabel={exercise.name}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{exercise.name}</Text>
              <Muted>{detail}</Muted>
              {demo.kind === 'video' ? <Muted>{copy('moves.video')}</Muted> : null}
            </Card>
          );
        })}
      </View>
    </MovesFrame>
  );
}
