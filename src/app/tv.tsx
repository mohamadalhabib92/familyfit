import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { TvScreen } from '@/components/tv/focus';
import { LivingHome } from '@/components/tv/LivingHome';
import { LivingSession } from '@/components/tv/LivingSession';
import { LivingSettings } from '@/components/tv/LivingSettings';
import { useTvMenu } from '@/components/tv/useTvMenu';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { todayPlan, todayPlayParams, type PlayParams } from '@/lib/homePractice';
import { isTv } from '@/lib/platform';
import { uid } from '@/lib/storage';

type Mode = 'home' | 'play' | 'settings';

/**
 * Salon 10 pieds. Les coachs filmés et la séance du jour sont les mêmes que sur l’iPhone.
 * Le fini est dans Réglages, pas pendant le mouvement.
 * Aucune clé @familyfit/ nouvelle : le journal passe par le disque fitness déjà là.
 */
export default function LivingRoom() {
  const { me, logWorkout } = useData();
  const [mode, setMode] = useState<Mode>('home');
  const [plan, setPlan] = useState<PlayParams>(() => todayPlayParams(todayPlan(todayISO())));
  const backHome = useCallback(() => setMode('home'), []);
  useTvMenu(isTv(), mode === 'home' ? 'profiles' : 'session', backHome);

  const start = (params: PlayParams) => {
    setPlan(params);
    setMode('play');
  };

  if (mode === 'settings') return <LivingSettings onBack={backHome} />;

  if (mode === 'play') {
    return (
      <TvScreen>
        <LivingSession
          params={plan}
          onBack={backHome}
          onComplete={(durationSec) => {
            logWorkout({
              id: uid('wo_'),
              routineId: `seance-${plan.audience}-${plan.minutes}`,
              coachId: 'lina',
              memberIds: me ? [me.id] : [],
              date: todayISO(),
              completedAt: new Date().toISOString(),
              durationSec,
              warmupCompleted: true,
              together: plan.audience === 'famille' && Boolean(me),
            });
          }}
        />
      </TvScreen>
    );
  }

  return (
    <TvScreen>
      <View style={{ flex: 1 }}>
        <LivingHome onStart={start} onSettings={() => setMode('settings')} />
      </View>
    </TvScreen>
  );
}
