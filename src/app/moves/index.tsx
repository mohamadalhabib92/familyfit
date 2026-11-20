import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { CoachPicker } from '@/components/moves/CoachPicker';
import { MovesFrame } from '@/components/moves/MovesFrame';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import { BODY_PARTS, rosterCoachId, type BodyPartId, type RosterCoachId } from '@/lib/coachLibrary';
import { translate, type CopyKey } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import { claimsPreferredFocus, profileGrid } from '@/lib/tvSurface';
import { Card, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function MovePicker() {
  const router = useRouter();
  const { prefs } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const [coachId, setCoachId] = useState<RosterCoachId>('coach-homme');
  const tv = isTv();
  const window = useWindowDimensions();
  const grid = profileGrid(window, BODY_PARTS.length);

  const open = (part: BodyPartId) => {
    const next = part === 'enfants' && coachId !== 'coach-afrique-ouest' && coachId !== 'coach-papa-garcon'
      ? 'coach-papa-garcon'
      : coachId;
    router.push({ pathname: '/moves/[part]', params: { part, coach: next } });
  };

  return (
    <MovesFrame title={copy('moves.title')} subtitle={copy('moves.lead')} backLabel={copy('moves.back')}>
      <CoachPicker selected={rosterCoachId(coachId, 'coach-homme')} onSelect={setCoachId} label={copy('moves.coach')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tv ? grid.gap : 12 }}>
        {BODY_PARTS.map((part, index) => {
          if (tv) {
            return (
              <TvFocusable
                key={part.id}
                preferred={claimsPreferredFocus('profile', index)}
                label={part.title}
                onPress={() => open(part.id)}
                style={{ width: grid.cardWidth, minHeight: Math.max(140, grid.cardHeight) }}
              >
                <TvText size={32} weight="800" color="#1D2522">{part.title}</TvText>
                <TvText size={20} color="#3D4A44">{part.blurb}</TvText>
              </TvFocusable>
            );
          }
          return (
            <Card key={part.id} onPress={() => open(part.id)} accessibilityLabel={part.title}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{part.title}</Text>
              <Muted>{part.blurb}</Muted>
            </Card>
          );
        })}
      </View>
    </MovesFrame>
  );
}
