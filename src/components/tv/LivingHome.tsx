import { useRouter } from 'expo-router';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { OfflineNote } from '@/components/OfflineNote';
import { CoachAvatar } from '@/components/CoachAvatar';
import { CoachPhoto } from '@/components/moves/CoachPhoto';
import { IntensityBar } from '@/components/moves/IntensityBar';
import { TvFocusable, TvRail, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { BODY_PARTS, ROSTER, rosterById, type RosterCoachId } from '@/lib/coachLibrary';
import { COACHES } from '@/lib/coaches';
import { timingCaption, todayPlan, todayPlayParams, type PlayParams } from '@/lib/homePractice';
import { chooseToday, type Level, type ProgramMinutes } from '@/lib/training/engine';
import { translate, type CopyKey } from '@/lib/i18n';
import { profileGrid, TV_SAFE, tvSafeSize } from '@/lib/tvSurface';
import { theme as t } from '@/ui/theme';
import type { IntensityPhase } from '@/lib/progression';

export function LivingHome({
  onStart,
  onSettings,
}: {
  onStart: (params: PlayParams) => void;
  onSettings: () => void;
}) {
  const router = useRouter();
  const { prefs, fitness } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const window = useWindowDimensions();
  const safe = tvSafeSize(window);
  const plan = todayPlan(todayISO());
  const level: Level = plan.level === 'avance' ? 'avance' : plan.level === 'debutant' ? 'debutant' : 'intermediaire';
  const minutes = (plan.minutes === 10 || plan.minutes === 15 || plan.minutes === 20 || plan.minutes === 30 || plan.minutes === 45 ? plan.minutes : 20) as ProgramMinutes;
  const todayWorkout = chooseToday({
    today: todayISO(),
    logs: fitness.logs.map((log) => ({ routineId: log.routineId, date: log.date })),
    audience: plan.kids ? 'famille' : 'adulte',
    level,
    minutes,
  });
  const levelKey: CopyKey = plan.level === 'debutant' ? 'seance.debutant' : plan.level === 'avance' ? 'seance.avance' : 'seance.intermediaire';
  const title = plan.kids ? copy('home.kids') : copy('seance.title');
  const phases: Record<IntensityPhase, string> = {
    echauffement: copy('seance.echauffement'),
    montee: copy('seance.montee'),
    intense: copy('seance.intense'),
    retour: copy('seance.retour'),
  };
  const zoneGrid = profileGrid(window, BODY_PARTS.length);
  const moussa = rosterById('coach-afrique-ouest');
  const elias = rosterById('coach-papa-garcon');
  const columns = safe.width >= 1400 ? 6 : 4;
  const gap = 16;
  const tile = Math.floor((safe.width - gap * (columns - 1)) / columns);
  const photo = Math.max(120, tile - 48);

  const openZone = (part: string) => {
    router.push({
      pathname: '/moves/[part]',
      params: { part, coach: part === 'enfants' ? 'coach-papa-garcon' : 'coach-homme' },
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, minHeight: safe.height, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical, gap: 22 }}>
      <View style={{ flexDirection: 'row', gap: 28, flexGrow: 1, minHeight: Math.round(safe.height * 0.42) }}>
        <View style={{ flex: 1.35, justifyContent: 'space-between', gap: 16 }}>
          <View style={{ gap: 8 }}>
            <TvText size={26} color={t.muted}>{copy('home.session')}</TvText>
            <TvText size={Math.min(64, Math.round(safe.width / 28))} weight="800">{title}</TvText>
            <TvText size={28} weight="800">{todayWorkout.title[prefs.locale === 'en' ? 'en' : 'fr']} · {todayWorkout.week}</TvText>
            <TvText size={28} color={t.muted}>{plan.minutes} {copy('seance.min')} · {copy(levelKey)} · {copy('home.offline')}</TvText>
            <OfflineNote tv />
            <TvText size={24} color={t.text}>{copy('home.arc')}</TvText>
            <TvText size={24} weight="800">{timingCaption(plan)}</TvText>
          </View>
          <IntensityBar phase="echauffement" fill={0.18} labels={phases} detail={copy('home.reps')} />
          <TvFocusable preferred label={copy('train.start')} onPress={() => onStart(todayPlayParams(plan))} style={{ minHeight: 96 }}>
            <TvText size={40} weight="800">{copy('train.start')}</TvText>
          </TvFocusable>
        </View>
        <View style={{ flex: 0.9, justifyContent: 'space-between', gap: 16 }}>
          <TvText size={32} weight="800">{copy('home.kids')}</TvText>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <CoachPhoto coach={moussa} width={Math.min(280, Math.round(safe.width * 0.16))} />
              <TvText size={28} weight="800">{moussa.nameFr}</TvText>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <CoachPhoto coach={elias} width={Math.min(280, Math.round(safe.width * 0.16))} />
              <TvText size={28} weight="800">{elias.nameFr}</TvText>
            </View>
          </View>
          <TvText size={22} color={t.muted}>{copy('home.kidsLead')}</TvText>
          <TvFocusable label={copy('seance.famille')} onPress={() => onStart({ minutes: '15', level: 'debutant', audience: 'famille', coach: 'coach-papa-garcon' })} style={{ minHeight: 88 }}>
            <TvText size={32} weight="800">{copy('seance.start')}</TvText>
          </TvFocusable>
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <TvText size={32} weight="800">{copy('home.coaches')}</TvText>
            <TvText size={22} color={t.muted}>{copy('home.coachesLead')}</TvText>
          </View>
          <TvFocusable label={copy('tv.settings')} onPress={onSettings} style={{ minWidth: 220 }}>
            <TvText size={28} weight="800">{copy('tv.settings')}</TvText>
          </TvFocusable>
        </View>
        <TvRail items={[...COACHES, ...ROSTER]} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {COACHES.map((coach) => (
            <TvFocusable
              key={coach.id}
              label={coach.name}
              onPress={() => onStart(todayPlayParams(plan.kids ? { ...plan, kids: false, audience: 'adulte', minutes: 15, level: 'intermediaire' } : plan))}
              style={{ width: tile }}
            >
              <CoachAvatar coachId={coach.id} size={Math.min(96, photo)} />
              <TvText size={24} weight="800">{coach.name}</TvText>
              <TvText size={18} color={t.muted}>{coach.id === 'lina' || coach.id === 'noor' ? copy('home.kept') : copy('home.drawn')}</TvText>
            </TvFocusable>
          ))}
          {ROSTER.map((coach) => (
            <TvFocusable key={coach.id} label={`${coach.nameFr}, ${coach.role}`} onPress={() => onStart(playForCoach(coach.id))} style={{ width: tile }}>
              <CoachPhoto coach={coach} width={photo} />
              <TvText size={24} weight="800">{coach.nameFr}</TvText>
              <TvText size={18} color={t.muted}>{coach.note ?? coach.role}</TvText>
            </TvFocusable>
          ))}
        </TvRail>
      </View>

      <View style={{ gap: 12 }}>
        <TvText size={32} weight="800">{copy('home.zones')}</TvText>
        <TvRail items={BODY_PARTS} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: zoneGrid.gap }}>
          {BODY_PARTS.map((part) => (
            <TvFocusable key={part.id} label={part.title} onPress={() => openZone(part.id)} style={{ width: zoneGrid.cardWidth, minHeight: Math.max(110, Math.round(zoneGrid.cardHeight * 0.55)) }}>
              <TvText size={28} weight="800">{part.title}</TvText>
              <TvText size={18} color={t.muted}>{part.blurb}</TvText>
            </TvFocusable>
          ))}
        </TvRail>
      </View>
    </ScrollView>
  );
}

function playForCoach(id: RosterCoachId): PlayParams {
  if (id === 'coach-papa-garcon' || id === 'coach-afrique-ouest') {
    return { minutes: '15', level: 'debutant', audience: 'famille', coach: 'coach-papa-garcon' };
  }
  return { minutes: '15', level: 'intermediaire', audience: 'adulte', coach: id };
}
