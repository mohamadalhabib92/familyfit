import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { COACH_PHOTO } from '@/components/moves/media';
import type { RosterCoach } from '@/lib/coachLibrary';
import { inkOn } from '@/ui/contrast';

/** Photo du coach, ou pastille neutre si le fichier ne s’affiche pas. */
export function CoachPhoto({ coach, width }: { coach: RosterCoach; width: number }) {
  const [broken, setBroken] = useState(false);
  const height = Math.round(width * 9 / 16);
  const source = COACH_PHOTO[coach.id];
  const label = `${coach.role}, ${coach.nameFr}`;
  if (!source || broken) {
    return (
      <View accessibilityRole="image" accessibilityLabel={label} style={{ width, height, borderRadius: 16, backgroundColor: coach.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: inkOn(coach.tint), fontSize: Math.max(22, Math.round(width * 0.18)), fontWeight: '800' }}>{coach.nameFr.slice(0, 1)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={source}
      accessibilityLabel={label}
      onError={() => setBroken(true)}
      resizeMode="cover"
      style={{ width, height, borderRadius: 16, backgroundColor: coach.tint }}
    />
  );
}
