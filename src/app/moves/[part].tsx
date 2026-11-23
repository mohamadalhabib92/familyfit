import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { CoachPhoto } from '@/components/moves/CoachPhoto';
import { CoachPicker } from '@/components/moves/CoachPicker';
import { MovesFrame } from '@/components/moves/MovesFrame';
import { TvFocusable, TvRail, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import {
  bodyPartById, exercisesFor, resolveDemo, rosterById, rosterCoachId, LEVEL_LABEL,
  type BodyPartId, type RosterCoachId,
} from '@/lib/coachLibrary';
import { focusRail } from '@/lib/tvFocus';
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
  useEffect(() => {
    setCoachId(rosterCoachId(coach, part?.id === 'enfants' ? 'coach-papa-garcon' : 'coach-homme'));
  }, [coach, part?.id]);
  const tv = isTv();
  const window = useWindowDimensions();
  if (!part) {
    return (
      <MovesFrame title={copy('moves.title')} backLabel={copy('moves.back')}>
        <Empty icon="search-outline" title={copy('moves.missing')} text={copy('moves.lead')} />
      </MovesFrame>
    );
  }
  const rows = focusRail(exercisesFor(part.id as BodyPartId));
  const grid = profileGrid(window, rows.length);
  const open = (id: string) => {
    router.push({ pathname: '/moves/demo/[id]', params: { id, coach: coachId } });
  };
  return (
    <MovesFrame title={part.title} subtitle={part.id === 'enfants' ? copy('moves.kidsNote') : part.blurb} backLabel={copy('moves.back')}>
      <CoachPicker selected={coachId} onSelect={setCoachId} label={copy('moves.coach')} />
      <TvRail items={rows} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tv ? grid.gap : 12 }}>
        {rows.map((exercise, index) => {
          const demo = resolveDemo(exercise, coachId);
          const shown = rosterById(demo.coachId);
          const detail = `${LEVEL_LABEL[exercise.level]} · ${exercise.dose}`;
          const photo = tv ? Math.min(240, grid.cardWidth - 36) : 128;
          if (tv) {
            return (
              <TvFocusable
                key={exercise.id}
                preferred={claimsPreferredFocus('profile', index)}
                label={`${exercise.name}. ${detail}`}
                onPress={() => open(exercise.id)}
                style={{ width: grid.cardWidth, minHeight: 150 }}
              >
                <CoachPhoto coach={shown} width={photo} />
                <TvText size={30} weight="800">{exercise.name}</TvText>
                <TvText size={20} color={t.muted}>{detail}</TvText>
                {demo.kind === 'video' ? <TvText size={18} weight="700" color={t.primary}>{copy('moves.video')}</TvText> : null}
              </TvFocusable>
            );
          }
          return (
            <Card key={exercise.id} onPress={() => open(exercise.id)} accessibilityLabel={exercise.name}>
              <CoachPhoto coach={shown} width={photo} />
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{exercise.name}</Text>
              <Muted>{detail}</Muted>
              {demo.kind === 'video' ? <Muted>{copy('moves.video')}</Muted> : <Muted>{copy('moves.noVideo')}</Muted>}
            </Card>
          );
        })}
      </TvRail>
    </MovesFrame>
  );
}
