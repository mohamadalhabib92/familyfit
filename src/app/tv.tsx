import { useState } from 'react';
import { View } from 'react-native';
import { CoachAvatar } from '@/components/CoachAvatar';
import { SessionPlayer } from '@/components/SessionPlayer';
import { TvFocusable, TvScreen, TvScroll, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { translate } from '@/lib/i18n';
import { displayName } from '@/lib/model';
import { uid } from '@/lib/storage';
import { adaptRoutine, defaultAgeBand, guidedAllowed, ROUTINES, type CoachId } from '@/lib/workoutEngine';
import { theme as t } from '@/ui/theme';

/** Salon 10 pieds. Les données famille et santé ne sont pas réécrites ici, seulement lues, plus un journal de séance. */
export default function LivingRoom() {
  const { members, me, prefs, logWorkout } = useData();
  const locale = prefs.locale;
  const copy = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [routineId, setRoutineId] = useState(ROUTINES[0]?.id ?? 'morning-together');
  const people = members.filter((m) => guidedAllowed(m));
  const member = people.find((m) => m.id === memberId);
  const routine = ROUTINES.find((r) => r.id === routineId) ?? ROUTINES[0];
  const band = member ? defaultAgeBand(member) : 'adult';
  const coachId: CoachId = routine?.coachId ?? 'lina';

  if (!member || !routine) {
    return (
      <TvScreen>
        <TvScroll>
          <TvText size={22} color={t.muted}>{copy('tv.remote')}</TvText>
          <TvText size={56} weight="800">{copy('tv.pick')}</TvText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28, marginTop: 28 }}>
            {people.map((m, index) => (
              <TvFocusable key={m.id} preferred={index === 0} label={displayName(m, me)} onPress={() => setMemberId(m.id)} style={{ width: 360 }}>
                <TvText size={36} weight="800" color="#1D2522">{displayName(m, me)}</TvText>
                <TvText size={22} color="#3D4A44">{copy(`age.${defaultAgeBand(m)}` as 'age.adult')}</TvText>
              </TvFocusable>
            ))}
          </View>
        </TvScroll>
      </TvScreen>
    );
  }

  return (
    <TvScreen>
      <TvScroll>
        <View style={{ flexDirection: 'row', gap: 48, alignItems: 'flex-start' }}>
          <View style={{ width: 420, gap: 18 }}>
            <CoachAvatar coachId={coachId} size={280} />
            <TvText size={48} weight="800">{routine.name[locale]}</TvText>
            <TvText size={22} color={t.muted}>{copy('tv.remote')}</TvText>
            <TvFocusable label={copy('tv.back')} onPress={() => setMemberId(null)}>
              <TvText size={28} weight="800" color="#1D2522">{copy('tv.back')}</TvText>
            </TvFocusable>
            {ROUTINES.map((r, index) => (
              <TvFocusable key={r.id} preferred={index === 0} label={r.name[locale]} onPress={() => setRoutineId(r.id)}>
                <TvText size={26} weight="800" color="#1D2522">{r.name[locale]}</TvText>
              </TvFocusable>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <SessionPlayer
              key={`${member.id}:${routine.id}`}
              blocks={adaptRoutine(routine.id, band)}
              coachId={coachId}
              locale={locale}
              band={band}
              voice={false}
              participants={[{ id: member.id, name: displayName(member, me), band }]}
              onComplete={(durationSec) => {
                logWorkout({
                  id: uid('wo_'),
                  routineId: routine.id,
                  coachId,
                  memberIds: [member.id],
                  date: todayISO(),
                  completedAt: new Date().toISOString(),
                  durationSec,
                  warmupCompleted: true,
                  together: false,
                });
              }}
            />
          </View>
        </View>
      </TvScroll>
    </TvScreen>
  );
}
