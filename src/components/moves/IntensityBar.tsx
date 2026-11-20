import { Text, View } from 'react-native';
import { INTENSITY_PHASES, type IntensityPhase } from '@/lib/progression';
import { isTv } from '@/lib/platform';
import { theme as t } from '@/ui/theme';

const RANK: Record<IntensityPhase, number> = { echauffement: 0, montee: 1, intense: 2, retour: 3 };

/** Quatre temps. Le segment en cours est doré, ceux déjà faits sont forêt, la suite reste claire. */
export function IntensityBar({
  phase,
  fill,
  labels,
  detail,
}: {
  phase: IntensityPhase | null;
  fill: number;
  labels: Record<IntensityPhase, string>;
  detail: string;
}) {
  const tv = isTv();
  const current = phase ? RANK[phase] : -1;
  const clamped = Math.max(0, Math.min(1, fill));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={detail} accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }} style={{ gap: tv ? 12 : 8 }}>
      <View style={{ height: tv ? 22 : 12, borderRadius: 11, backgroundColor: t.border, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(clamped * 100)}%`, height: '100%', backgroundColor: t.primary }} />
      </View>
      <View style={{ flexDirection: 'row', gap: tv ? 10 : 6 }}>
        {INTENSITY_PHASES.map((item) => {
          const rank = RANK[item];
          const on = rank < current || (phase === item);
          const active = phase === item;
          return (
            <View key={item} style={{ flex: 1, gap: 4 }}>
              <View style={{ height: tv ? 14 : 8, borderRadius: 7, backgroundColor: active ? t.accent : on ? t.primary : t.border }} />
              <Text style={{ color: active ? t.text : t.muted, fontSize: tv ? 18 : 11, fontWeight: active ? '800' : '600', lineHeight: tv ? 22 : 14 }}>{labels[item]}</Text>
            </View>
          );
        })}
      </View>
      <Text style={{ color: t.text, fontSize: tv ? 24 : 15, fontWeight: '700' }}>{detail}</Text>
    </View>
  );
}
