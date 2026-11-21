import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { SessionPlayer } from '@/components/SessionPlayer';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { writeHealthWorkout } from '@/lib/healthBridge';
import { displayName } from '@/lib/model';
import { translate } from '@/lib/i18n';
import { uid } from '@/lib/storage';
import { adaptRoutine, defaultAgeBand, guidedAllowed, ROUTINES, sharedClock, type CoachId } from '@/lib/workoutEngine';
import { Button, Empty, Screen } from '@/ui/kit';

const COACHS = new Set(['lina', 'noor', 'pico', 'sami']);

export default function WorkoutScreen() {
  const { id, members: memberParam, coach } = useLocalSearchParams<{ id: string; members?: string; coach?: string }>();
  const { members, me, prefs, logWorkout, fitness } = useData();
  const router = useRouter();
  const locale = prefs.locale;
  const copy = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const routine = ROUTINES.find((r) => r.id === id);
  const ids = (memberParam ?? me?.id ?? '').split(',').filter(Boolean);
  const people = members.filter((m) => ids.includes(m.id) && guidedAllowed(m));
  const coachId: CoachId = COACHS.has(String(coach)) ? (coach as CoachId) : routine?.coachId ?? 'lina';
  const plans = useMemo(() => people.map((m) => adaptRoutine(routine?.id ?? 'morning-together', defaultAgeBand(m))), [people, routine?.id]);
  const clock = useMemo(() => sharedClock(plans), [plans]);
  const band = people[0] ? defaultAgeBand(people[0]) : 'adult';

  const onComplete = useCallback((durationSec: number) => {
    if (!routine || !people.length) return;
    const end = new Date();
    const start = new Date(end.getTime() - durationSec * 1000);
    logWorkout({
      id: uid('wo_'),
      routineId: routine.id,
      coachId,
      memberIds: people.map((m) => m.id),
      date: todayISO(),
      completedAt: end.toISOString(),
      durationSec,
      warmupCompleted: true,
      together: people.length > 1,
    });
    if (fitness.healthStatus === 'granted') {
      void writeHealthWorkout(start.toISOString(), end.toISOString(), routine.name.fr);
    }
  }, [routine, people, coachId, logWorkout, fitness.healthStatus]);

  if (!routine || !people.length) {
    return (
      <Screen>
        <Empty icon="lock-closed-outline" title={copy('train.blocked')} text={copy('train.none')} action={<Button title={copy('tab.train')} onPress={() => router.back()} />} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: routine.name[locale] }} />
      <SessionPlayer
        blocks={clock}
        coachId={coachId}
        locale={locale}
        band={band}
        voice
        participants={people.map((m) => ({ id: m.id, name: displayName(m, me), band: defaultAgeBand(m) }))}
        onComplete={onComplete}
      />
    </Screen>
  );
}
