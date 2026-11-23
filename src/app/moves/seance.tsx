import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { IntensityBar } from '@/components/moves/IntensityBar';
import { CoachPicker } from '@/components/moves/CoachPicker';
import { MovesFrame } from '@/components/moves/MovesFrame';
import { TvFocusable, TvRail, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import { rosterCoachId, type RosterCoachId } from '@/lib/coachLibrary';
import { translate, type CopyKey } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import {
  COOLDOWN_TIMING, PHASE_TIMING, SESSION_LEVELS, SESSION_MINUTES,
  type IntensityPhase, type SessionAudience, type SessionLevel, type SessionMinutes, type Tempo,
} from '@/lib/progression';
import { Button, Card, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function ProgressiveBuilder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ coach?: string }>();
  const { prefs } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const tv = isTv();
  const [audience, setAudience] = useState<SessionAudience>('adulte');
  const [level, setLevel] = useState<SessionLevel>('intermediaire');
  const [minutes, setMinutes] = useState<SessionMinutes>(20);
  const [coachId, setCoachId] = useState<RosterCoachId>(rosterCoachId(params.coach, 'coach-homme'));
  const phaseLabel = phaseNames(copy);
  const timing = PHASE_TIMING[audience][level];
  const cool = COOLDOWN_TIMING[audience];
  const detail = `${timing.echauffement.work} s / ${timing.echauffement.rest} s · ${timing.montee.work} s / ${timing.montee.rest} s · ${timing.intense.work} s / ${timing.intense.rest} s · ${cool.work} s / ${cool.rest} s`;
  const tempoLine = `${copy(tempoKey(timing.echauffement.tempo))} → ${copy(tempoKey(timing.montee.tempo))} → ${copy(tempoKey(timing.intense.tempo))} → ${copy(tempoKey(cool.tempo))}`;

  const start = () => {
    router.push({
      pathname: '/moves/seance-play',
      params: { minutes: String(minutes), level, audience, coach: audience === 'famille' ? 'coach-papa-garcon' : coachId },
    });
  };

  return (
    <MovesFrame title={copy('seance.title')} subtitle={copy('seance.lead')} backLabel={copy('moves.back')}>
      <Stack.Screen options={{ title: copy('seance.title'), headerShown: !tv }} />
      <IntensityBar phase={null} fill={0} labels={phaseLabel} detail={detail} />
      {tv ? <TvText size={22} color={t.muted}>{tempoLine}</TvText> : <Muted>{tempoLine}</Muted>}
      <Choice
        label={copy('train.who')}
        options={[
          { id: 'adulte' as const, title: copy('seance.adulte') },
          { id: 'famille' as const, title: copy('seance.famille') },
        ]}
        selected={audience}
        onSelect={setAudience}
      />
      <Choice
        label={copy('seance.level')}
        options={SESSION_LEVELS.map((id) => ({ id, title: copy(levelKey(id)) }))}
        selected={level}
        onSelect={setLevel}
      />
      <Choice
        label={copy('seance.duration')}
        options={SESSION_MINUTES.map((id) => ({ id, title: `${id} ${copy('seance.min')}` }))}
        selected={minutes}
        onSelect={(id) => setMinutes(id)}
      />
      {audience === 'famille' ? (
        tv ? <TvText size={24} color={t.muted}>{copy('seance.familleLead')}</TvText> : <Muted>{copy('seance.familleLead')}</Muted>
      ) : (
        <CoachPicker selected={coachId} onSelect={setCoachId} label={copy('moves.coach')} />
      )}
      {tv ? (
        <TvFocusable preferred label={copy('seance.start')} onPress={start}>
          <TvText size={32} weight="800">{copy('seance.start')}</TvText>
        </TvFocusable>
      ) : (
        <Button title={copy('seance.start')} icon="play" onPress={start} />
      )}
    </MovesFrame>
  );
}

function Choice<T extends string | number>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { id: T; title: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  const tv = isTv();
  return (
    <View style={{ gap: tv ? 12 : 8 }}>
      {tv ? <TvText size={28} weight="800">{label}</TvText> : <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{label}</Text>}
      <TvRail items={options} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tv ? 16 : 8 }}>
        {options.map((option) => {
          const on = option.id === selected;
          if (tv) {
            return (
              <TvFocusable key={String(option.id)} selected={on} label={option.title} onPress={() => onSelect(option.id)} style={{ minWidth: 220, flexGrow: 1 }}>
                <TvText size={28} weight="800">{option.title}</TvText>
              </TvFocusable>
            );
          }
          return (
            <Card key={String(option.id)} onPress={() => onSelect(option.id)} accessibilityLabel={option.title} style={{ flexGrow: 1, minWidth: 140, borderWidth: on ? 2 : undefined, borderColor: on ? t.primary : t.border }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{option.title}</Text>
            </Card>
          );
        })}
      </TvRail>
    </View>
  );
}

function phaseNames(copy: (key: CopyKey) => string): Record<IntensityPhase, string> {
  return {
    echauffement: copy('seance.echauffement'),
    montee: copy('seance.montee'),
    intense: copy('seance.intense'),
    retour: copy('seance.retour'),
  };
}

function levelKey(level: SessionLevel): CopyKey {
  if (level === 'debutant') return 'seance.debutant';
  if (level === 'avance') return 'seance.avance';
  return 'seance.intermediaire';
}

function tempoKey(tempo: Tempo): CopyKey {
  if (tempo === 'lent') return 'seance.lent';
  if (tempo === 'rapide') return 'seance.rapide';
  return 'seance.modere';
}
