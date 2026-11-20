import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SessionPlayer } from '@/components/SessionPlayer';
import { TvFocusable, TvScreen, TvText } from '@/components/tv/focus';
import { useTvMenu } from '@/components/tv/useTvMenu';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { translate, type CopyKey } from '@/lib/i18n';
import { displayName } from '@/lib/model';
import { isTv } from '@/lib/platform';
import { uid } from '@/lib/storage';
import { canSwitchRoutine, claimsPreferredFocus, profileGrid, TV_SAFE, workoutColumns } from '@/lib/tvSurface';
import { adaptRoutine, defaultAgeBand, guidedAllowed, ROUTINES, type CoachId } from '@/lib/workoutEngine';
import { theme as t } from '@/ui/theme';
import type { Finish } from '@/ui/ThemeProvider';

const FINISHES: { value: Finish; key: CopyKey }[] = [
  { value: 'classic', key: 'settings.classic' },
  { value: 'verre', key: 'settings.verre' },
  { value: 'verre-or', key: 'settings.verreOr' },
];

/** Salon 10 pieds. Les données famille ne sont pas réécrites ici, seulement lues, plus un journal de séance et le fini déjà dans les préférences. */
export default function LivingRoom() {
  const router = useRouter();
  const { members, me, prefs, setPrefs, logWorkout } = useData();
  const locale = prefs.locale;
  const copy = (key: CopyKey) => translate(locale, key);
  const window = useWindowDimensions();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [routineId, setRoutineId] = useState(ROUTINES[0]?.id ?? 'morning-together');
  const [running, setRunning] = useState(false);
  const [lockNote, setLockNote] = useState('');
  const people = members.filter((m) => guidedAllowed(m));
  const member = people.find((m) => m.id === memberId) ?? null;
  const routine = ROUTINES.find((r) => r.id === routineId) ?? ROUTINES[0];
  const surface = member && routine ? 'session' : 'profiles';
  const backToProfiles = useCallback(() => {
    setMemberId(null);
    setRunning(false);
    setLockNote('');
  }, []);
  useTvMenu(isTv(), surface, backToProfiles);

  const chooseFinish = (finish: Finish) => setPrefs((prev) => ({ ...prev, finish }));

  if (!member || !routine) {
    const grid = profileGrid(window, people.length);
    const titleSize = Math.round(Math.min(56, Math.max(36, window.width / 34)));
    return (
      <TvScreen>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical, gap: 28 }}>
          <View style={{ gap: 8 }}>
            <TvText size={Math.max(22, Math.round(titleSize * 0.42))} color={t.muted}>{copy('tv.remote')}</TvText>
            <TvText size={titleSize} weight="800">{people.length ? copy('tv.pick') : copy('tv.emptyTitle')}</TvText>
            {people.length === 0 ? <TvText size={26} color={t.muted}>{copy('tv.emptyBody')}</TvText> : null}
          </View>
          {people.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: grid.gap }}>
              {people.map((m, index) => (
                <TvFocusable
                  key={m.id}
                  preferred={claimsPreferredFocus('profile', index)}
                  label={displayName(m, me)}
                  onPress={() => setMemberId(m.id)}
                  style={{ width: grid.cardWidth, minHeight: grid.cardHeight }}
                >
                  <TvText size={36} weight="800" color="#1D2522">{displayName(m, me)}</TvText>
                  <TvText size={22} color="#3D4A44">{copy(`age.${defaultAgeBand(m)}` as 'age.adult')}</TvText>
                </TvFocusable>
              ))}
            </View>
          ) : null}
          <TvFocusable label={copy('moves.open')} onPress={() => router.push('/moves')}>
            <TvText size={28} weight="800" color="#1D2522">{copy('moves.open')}</TvText>
            <TvText size={20} color="#3D4A44">{copy('moves.lead')}</TvText>
          </TvFocusable>
          <FinishRow locale={locale} finish={prefs.finish} preferFirst={people.length === 0} onChange={chooseFinish} />
        </ScrollView>
      </TvScreen>
    );
  }

  const frame = workoutColumns(window);
  const band = defaultAgeBand(member);
  const coachId: CoachId = routine.coachId ?? 'lina';
  const chooseRoutine = (id: string) => {
    if (!canSwitchRoutine(running, routine.id, id)) {
      setLockNote(copy('tv.routineLocked'));
      return;
    }
    setLockNote('');
    setRoutineId(id);
  };

  return (
    <TvScreen>
      <View style={{ flex: 1, flexDirection: 'row', gap: frame.gap, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical }}>
        <View style={{ width: frame.leftWidth }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16 }}>
          <TvText size={22} color={t.muted}>{copy('tv.remote')}</TvText>
          <TvText size={34} weight="800">{routine.name[locale]}</TvText>
          <TvFocusable label={copy('tv.back')} onPress={backToProfiles}>
            <TvText size={26} weight="800" color="#1D2522">{copy('tv.back')}</TvText>
          </TvFocusable>
          {ROUTINES.map((item, index) => (
            <TvFocusable
              key={item.id}
              preferred={claimsPreferredFocus('routine', index)}
              selected={item.id === routine.id}
              label={item.name[locale]}
              onPress={() => chooseRoutine(item.id)}
            >
              <TvText size={24} weight="800" color="#1D2522">{item.name[locale]}</TvText>
              {item.id === routine.id ? <TvText size={18} color="#3D4A44">{copy('tv.selected')}</TvText> : null}
            </TvFocusable>
          ))}
          {lockNote ? <TvText size={22} color={t.warning}>{lockNote}</TvText> : null}
          <FinishRow locale={locale} finish={prefs.finish} preferFirst={false} onChange={chooseFinish} />
          </ScrollView>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <SessionPlayer
            sessionKey={`${member.id}:${routine.id}`}
            blocks={adaptRoutine(routine.id, band)}
            coachId={coachId}
            locale={locale}
            band={band}
            voice={false}
            participants={[{ id: member.id, name: displayName(member, me), band }]}
            onRunningChange={setRunning}
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
    </TvScreen>
  );
}

function FinishRow({
  locale,
  finish,
  preferFirst,
  onChange,
}: {
  locale: Parameters<typeof translate>[0];
  finish: Finish;
  preferFirst: boolean;
  onChange: (finish: Finish) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <TvText size={22} color={t.muted}>{translate(locale, 'settings.finish')}</TvText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {FINISHES.map((item, index) => (
          <TvFocusable
            key={item.value}
            preferred={preferFirst && claimsPreferredFocus('empty', index)}
            selected={finish === item.value}
            label={translate(locale, item.key)}
            onPress={() => onChange(item.value)}
            style={{ flexGrow: 1, flexBasis: 180 }}
          >
            <TvText size={24} weight="800" color="#1D2522">{translate(locale, item.key)}</TvText>
          </TvFocusable>
        ))}
      </View>
    </View>
  );
}
