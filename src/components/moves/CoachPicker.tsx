import { Text, View, useWindowDimensions } from 'react-native';
import { CoachPhoto } from '@/components/moves/CoachPhoto';
import { TvFocusable, TvText } from '@/components/tv/focus';
import { ROSTER, type RosterCoachId } from '@/lib/coachLibrary';
import { isTv } from '@/lib/platform';
import { profileGrid } from '@/lib/tvSurface';
import { Card, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export function CoachPicker({
  selected,
  onSelect,
  label,
}: {
  selected: RosterCoachId;
  onSelect: (id: RosterCoachId) => void;
  label: string;
}) {
  const tv = isTv();
  const window = useWindowDimensions();
  const grid = profileGrid(window, ROSTER.length);
  return (
    <View style={{ gap: tv ? 16 : 8 }}>
      {tv ? <TvText size={28} weight="800">{label}</TvText> : <Muted>{label}</Muted>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tv ? grid.gap : 12 }}>
        {ROSTER.map((coach) => {
          const active = coach.id === selected;
          const caption = `${coach.nameFr}. ${coach.role}${coach.note ? `. ${coach.note}` : ''}`;
          if (tv) {
            return (
              <TvFocusable
                key={coach.id}
                selected={active}
                label={caption}
                onPress={() => onSelect(coach.id)}
                style={{ width: grid.cardWidth, minHeight: 220, alignItems: 'flex-start' }}
              >
                <CoachPhoto coach={coach} width={Math.min(280, grid.cardWidth - 48)} />
                <TvText size={26} weight="800" color="#1D2522">{coach.nameFr}</TvText>
                <TvText size={18} color="#3D4A44">{coach.role}</TvText>
              </TvFocusable>
            );
          }
          return (
            <Card key={coach.id} onPress={() => onSelect(coach.id)} accessibilityLabel={caption} style={{ width: '100%', borderWidth: active ? 2 : undefined, borderColor: active ? t.primary : t.border }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <CoachPhoto coach={coach} width={128} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{coach.nameFr}</Text>
                  <Muted>{coach.role}</Muted>
                  {coach.note ? <Muted>{coach.note}</Muted> : null}
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </View>
  );
}
