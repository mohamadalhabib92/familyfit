import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CoachAvatar } from '@/components/CoachAvatar';
import { SessionPlayer } from '@/components/SessionPlayer';
import { useData } from '@/lib/data';
import { displayName } from '@/lib/model';
import { translate } from '@/lib/i18n';
import { todayISO } from '@/lib/dates';
import { uid } from '@/lib/storage';
import { adaptRoutine, defaultAgeBand, guidedAllowed, ROUTINES, type CoachId } from '@/lib/workoutEngine';
import { H1, Muted, Screen } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

/** Salon : gros coach, focus télécommande, un profil à la fois. */
export default function LivingRoom() {
  const { members, me, prefs, logWorkout } = useData();
  const locale = prefs.locale;
  const copy = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [routineId, setRoutineId] = useState(ROUTINES[0]?.id ?? 'morning-together');
  const member = members.find((m) => m.id === memberId && guidedAllowed(m));
  const routine = ROUTINES.find((r) => r.id === routineId) ?? ROUTINES[0];
  const band = member ? defaultAgeBand(member) : 'adult';
  const coachId: CoachId = routine?.coachId ?? 'lina';

  if (!member || !routine) {
    return (
      <Screen>
        <Muted>{copy('tv.remote')}</Muted>
        <H1>{copy('tv.pick')}</H1>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
          {members.filter((m) => guidedAllowed(m)).map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMemberId(m.id)}
              accessibilityRole="button"
              accessibilityLabel={displayName(m, me)}
              style={({ focused }: { pressed: boolean; focused?: boolean }) => ({
                width: 220, minHeight: 88, borderRadius: 24, padding: 16, backgroundColor: t.surface,
                borderWidth: focused ? 4 : 1, borderColor: focused ? t.primary : t.border, justifyContent: 'center',
              })}
            >
              <Text style={{ color: t.text, fontSize: 28, fontWeight: '700' }}>{displayName(m, me)}</Text>
              <Muted>{copy(`age.${defaultAgeBand(m)}` as 'age.adult')}</Muted>
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: 28, alignItems: 'flex-start' }}>
        <View style={{ width: 280, gap: 12 }}>
          <CoachAvatar coachId={coachId} size={220} />
          <H1>{routine.name[locale]}</H1>
          <Muted>{copy('tv.remote')}</Muted>
          <Pressable onPress={() => setMemberId(null)} accessibilityRole="button" style={({ focused }: { pressed: boolean; focused?: boolean }) => ({ minHeight: 56, justifyContent: 'center', borderWidth: focused ? 3 : 0, borderColor: t.primary, borderRadius: 16, paddingHorizontal: 8 })}>
            <Text style={{ color: t.text, fontSize: 20 }}>{copy('tv.back')}</Text>
          </Pressable>
          {ROUTINES.map((r) => (
            <Pressable key={r.id} onPress={() => setRoutineId(r.id)} accessibilityRole="button" style={({ focused }: { pressed: boolean; focused?: boolean }) => ({ minHeight: 52, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 14, borderWidth: focused || r.id === routine.id ? 3 : 0, borderColor: t.primary })}>
              <Text style={{ color: t.text, fontSize: 18 }}>{r.name[locale]}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <SessionPlayer
            key={`${member.id}:${routine.id}`}
            blocks={adaptRoutine(routine.id, band)}
            coachId={coachId}
            locale={locale}
            band={band}
            participants={[{ id: member.id, name: displayName(member, me), band }]}
            onComplete={(durationSec) => {
              const end = new Date();
              logWorkout({
                id: uid('wo_'), routineId: routine.id, coachId, memberIds: [member.id], date: todayISO(),
                completedAt: end.toISOString(), durationSec, warmupCompleted: true, together: false,
              });
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
