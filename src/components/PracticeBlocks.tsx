import { useRouter } from 'expo-router';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { CoachAvatar } from '@/components/CoachAvatar';
import { CoachPhoto } from '@/components/moves/CoachPhoto';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import {
  KIDS_PLAY, KEPT_PAIR, practiceStreak, practiceWeekSeconds, timingCaption, todayPlan, todayPlayParams,
  type PlayParams,
} from '@/lib/homePractice';
import { BODY_PARTS, ROSTER, rosterById, type RosterCoachId } from '@/lib/coachLibrary';
import { coachById } from '@/lib/coaches';
import { translate, type CopyKey } from '@/lib/i18n';
import { COACH_IDS, type CoachId } from '@/lib/workoutEngine';
import { Button, Card, H2, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

function useCopy() {
  const { prefs } = useData();
  return (key: CopyKey) => translate(prefs.locale, key);
}

function play(router: ReturnType<typeof useRouter>, params: PlayParams) {
  router.push({ pathname: '/moves/seance-play', params });
}

export function TodaySessionCard() {
  const router = useRouter();
  const copy = useCopy();
  const plan = todayPlan(todayISO());
  const levelKey: CopyKey = plan.level === 'debutant' ? 'seance.debutant' : plan.level === 'avance' ? 'seance.avance' : 'seance.intermediaire';
  const title = plan.kids ? copy('home.kids') : copy('seance.title');
  return (
    <Card accessibilityLabel={copy('home.session')}>
      <Muted>{copy('home.session')}</Muted>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '800' }}>{title}</Text>
      <Muted>{plan.minutes} {copy('seance.min')} · {copy(levelKey)}</Muted>
      <Muted>{copy('home.arc')}</Muted>
      <Text style={{ color: t.text, fontWeight: '700' }}>{timingCaption(plan)}</Text>
      <Muted>{copy('home.reps')}</Muted>
      <Muted>{copy('home.offline')}</Muted>
      <Button title={copy('train.start')} icon="play" onPress={() => play(router, todayPlayParams(plan))} />
      <Button variant="secondary" title={copy('home.tune')} icon="options-outline" onPress={() => router.push('/moves/seance')} />
    </Card>
  );
}

export function WeekProgress() {
  const copy = useCopy();
  const { fitness } = useData();
  const today = todayISO();
  const seconds = practiceWeekSeconds(fitness.logs, today);
  const streak = practiceStreak(fitness.logs, today);
  const goal = Math.max(1, fitness.weeklyGoalMin || 60);
  const minutes = Math.round(seconds / 60);
  const pct = Math.max(0, Math.min(1, minutes / goal));
  return (
    <Card accessibilityLabel={copy('home.week')}>
      <H2>{copy('home.week')}</H2>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '800' }}>{streak}</Text>
          <Muted>{copy('train.streak')} · {copy('train.days')}</Muted>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '800' }}>{minutes}</Text>
          <Muted>/ {goal} {copy('train.minutes')}</Muted>
        </View>
      </View>
      <View style={{ height: 8, backgroundColor: t.surfaceAlt, borderRadius: 4, marginTop: 8 }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: 8, backgroundColor: t.success, borderRadius: 4 }} />
      </View>
      <Muted>{copy('train.boardEmpty')}</Muted>
    </Card>
  );
}

export function CoachTeam({
  selectedIllustrated,
  onIllustrated,
  onFilmed,
}: {
  selectedIllustrated?: CoachId;
  onIllustrated: (id: CoachId) => void;
  onFilmed: (id: RosterCoachId) => void;
}) {
  const copy = useCopy();
  const { prefs } = useData();
  return (
    <View style={{ gap: 8 }}>
      <H2>{copy('home.coaches')}</H2>
      <Muted>{copy('home.coachesLead')}</Muted>
      <Muted>{copy('home.drawn')}</Muted>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
        {COACH_IDS.map((id) => {
          const coach = coachById(id);
          const kept = (KEPT_PAIR as readonly string[]).includes(id);
          const on = selectedIllustrated === id;
          return (
            <Card key={id} accessibilityLabel={coach.name} onPress={() => onIllustrated(id)} style={{ width: 168, marginBottom: 0, borderWidth: on ? 2 : undefined, borderColor: on ? t.primary : t.border }}>
              <CoachAvatar coachId={id} size={72} />
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{coach.name}</Text>
              <Muted>{coach.title[prefs.locale]}</Muted>
              {kept ? <Text style={{ color: t.accentText, fontWeight: '700' }}>{copy('home.kept')}</Text> : null}
            </Card>
          );
        })}
      </ScrollView>
      <Muted>{copy('home.filmed')}</Muted>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
        {ROSTER.map((coach) => (
          <Card key={coach.id} accessibilityLabel={`${coach.nameFr}, ${coach.role}`} onPress={() => onFilmed(coach.id)} style={{ width: 180, marginBottom: 0 }}>
            <CoachPhoto coach={coach} width={144} />
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{coach.nameFr}</Text>
            <Muted>{coach.note ?? coach.role}</Muted>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

export function BodyPartGrid() {
  const router = useRouter();
  const copy = useCopy();
  return (
    <View style={{ gap: 8 }}>
      <H2>{copy('home.zones')}</H2>
      <Muted>{copy('moves.lead')}</Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {BODY_PARTS.map((part) => (
          <Card
            key={part.id}
            accessibilityLabel={part.title}
            onPress={() => router.push({
              pathname: '/moves/[part]',
              params: { part: part.id, coach: part.id === 'enfants' ? 'coach-papa-garcon' : 'coach-homme' },
            })}
            style={{ width: '47%', flexGrow: 1 }}
          >
            <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{part.title}</Text>
            <Muted>{part.blurb}</Muted>
          </Card>
        ))}
      </View>
    </View>
  );
}

export function KidsSessionCard() {
  const router = useRouter();
  const copy = useCopy();
  const window = useWindowDimensions();
  const photo = Math.max(96, Math.min(160, Math.round((window.width - 128) / 2)));
  const moussa = rosterById('coach-afrique-ouest');
  const elias = rosterById('coach-papa-garcon');
  return (
    <Card accessibilityLabel={copy('home.kids')}>
      <H2>{copy('home.kids')}</H2>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <CoachPhoto coach={moussa} width={photo} />
          <Text style={{ color: t.text, fontWeight: '800' }}>{moussa.nameFr}</Text>
          <Muted>{moussa.role}</Muted>
        </View>
        <View style={{ flex: 1 }}>
          <CoachPhoto coach={elias} width={photo} />
          <Text style={{ color: t.text, fontWeight: '800' }}>{elias.nameFr}</Text>
          <Muted>{elias.note ?? elias.role}</Muted>
        </View>
      </View>
      <Muted>{copy('home.kidsLead')}</Muted>
      <Button title={copy('seance.start')} icon="play" onPress={() => play(router, KIDS_PLAY)} />
    </Card>
  );
}

export function openFilmedCoach(router: ReturnType<typeof useRouter>, id: RosterCoachId) {
  if (id === 'coach-papa-garcon' || id === 'coach-afrique-ouest') {
    router.push({ pathname: '/moves/[part]', params: { part: 'enfants', coach: 'coach-papa-garcon' } });
    return;
  }
  router.push({ pathname: '/moves', params: { coach: id } });
}
