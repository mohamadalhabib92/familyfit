import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { CoachPhoto } from '@/components/moves/CoachPhoto';
import type { RosterCoach } from '@/lib/coachLibrary';
import { isTv } from '@/lib/platform';
import { useReduceMotion } from '@/ui/motion';
import { theme as t } from '@/ui/theme';

/** Étapes du geste sur la photo du coach, quand aucune vidéo n’est là. */
export function CueCard({ coach, steps, width }: { coach: RosterCoach; steps: string[]; width: number }) {
  const reduce = useReduceMotion();
  const tv = isTv();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [coach.id, steps]);
  useEffect(() => {
    if (reduce || steps.length < 2) return undefined;
    const timer = setInterval(() => setIndex((n) => (n + 1) % steps.length), 2400);
    return () => clearInterval(timer);
  }, [reduce, steps]);
  const size = tv ? 28 : 17;
  const shown = reduce ? steps : [steps[index] ?? steps[0]];
  return (
    <View accessibilityLiveRegion="polite" style={{ gap: 12 }}>
      <CoachPhoto coach={coach} width={width} />
      {shown.map((step, i) => (
        <Text key={`${coach.id}-${i}-${step}`} style={{ color: t.text, fontSize: size, lineHeight: Math.round(size * 1.35), fontWeight: '700' }}>
          {reduce ? `${i + 1}. ${step}` : step}
        </Text>
      ))}
      {reduce ? null : (
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`Étape ${index + 1} sur ${steps.length}`}>
          {steps.map((step, i) => (
            <View key={step} style={{ width: tv ? 14 : 8, height: tv ? 14 : 8, borderRadius: 8, backgroundColor: i === index ? t.primary : t.border }} />
          ))}
        </View>
      )}
    </View>
  );
}
