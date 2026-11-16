import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { CoachAvatar } from '@/components/CoachAvatar';
import { COACHES } from '@/lib/coaches';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { displayName } from '@/lib/model';
import { translate } from '@/lib/i18n';
import { HEALTH_DISCLAIMER } from '@/lib/health';
import { readHealthSteps, requestHealthPermissions } from '@/lib/healthBridge';
import { uid } from '@/lib/storage';
import { useWideLayout } from '@/lib/platform';
import {
  defaultAgeBand, EMPTY_FITNESS, guidedAllowed, leaderboard, ROUTINES, startOfWeekISO, streakEnding, weeklySeconds,
  type AgeBand, type CoachId,
} from '@/lib/workoutEngine';
import { Button, Card, Chip, Empty, H1, H2, Muted, Notice, Row, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Train() {
  const { members, me, fitness, setFitness, prefs } = useData();
  const router = useRouter();
  const wide = useWideLayout();
  const locale = prefs.locale;
  const copy = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [picked, setPicked] = useState<string[]>(me ? [me.id] : []);
  const [coachId, setCoachId] = useState<CoachId>(fitness.coachId || 'lina');
  const today = todayISO();
  const allowed = members.filter((m) => guidedAllowed(m));
  const selected = allowed.filter((m) => picked.includes(m.id));
  const board = leaderboard(fitness.logs, members.map((m) => m.id), today);
  const myDays = [...new Set(fitness.logs.filter((l) => me && l.memberIds.includes(me.id)).map((l) => l.date))];

  const open = (routineId: string) => {
    if (!selected.length) return;
    setFitness((prev) => ({ ...EMPTY_FITNESS, ...prev, coachId }));
    router.push({ pathname: '/workout/[id]', params: { id: routineId, members: selected.map((m) => m.id).join(','), coach: coachId } });
  };

  return (
    <Screen>
      <H1>{copy('train.title')}</H1>
      <Muted>{copy('train.lead')}</Muted>
      <Spacer />
      <Notice tone="info" title={HEALTH_DISCLAIMER} />
      <H2>{copy('train.who')}</H2>
      <Row wrap>
        {members.map((m) => {
          const ok = guidedAllowed(m);
          return (
            <Chip
              key={m.id}
              label={displayName(m, me)}
              color={m.color}
              active={picked.includes(m.id)}
              onPress={() => {
                if (!ok) return;
                setPicked((ids) => (ids.includes(m.id) ? ids.filter((id) => id !== m.id) : [...ids, m.id]));
              }}
            />
          );
        })}
      </Row>
      {members.some((m) => m.isMinor && !guidedAllowed(m)) ? <Muted>{copy('train.blocked')}</Muted> : null}
      {!selected.length ? <Muted>{copy('train.none')}</Muted> : null}
      <Spacer />
      <H2>{copy('train.coach')}</H2>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
        {COACHES.map((c) => (
          <Card key={c.id} onPress={() => setCoachId(c.id)} accessibilityLabel={c.name} style={{ flex: 1, borderWidth: coachId === c.id ? 2 : undefined, borderColor: coachId === c.id ? t.primary : t.border }}>
            <Row>
              <CoachAvatar coachId={c.id} size={72} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{c.name}</Text>
                <Muted>{c.title[locale]}</Muted>
                <Muted style={{ fontSize: 13 }}>{c.bio[locale]}</Muted>
              </View>
            </Row>
          </Card>
        ))}
      </View>
      <H2>{copy('train.level')}</H2>
      {selected.map((m) => (
        <Muted key={m.id}>{displayName(m, me)} · {copy(`age.${defaultAgeBand(m)}` as 'age.adult')}</Muted>
      ))}
      <Spacer />
      {ROUTINES.map((r) => (
        <Card key={r.id}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 18 }}>{r.name[locale]}</Text>
          <Muted>{r.blurb[locale]}</Muted>
          <Spacer h={8} />
          <Button title={copy('train.start')} icon="play" disabled={!selected.length} onPress={() => open(r.id)} />
        </Card>
      ))}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12 }}>
        <Card style={{ flex: 1 }}>
          <H2>{copy('train.streak')}</H2>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '700' }}>{streakEnding(myDays, today)}</Text>
          <Muted>{copy('train.days')}</Muted>
        </Card>
        <Card style={{ flex: 1 }}>
          <H2>{copy('train.goal')}</H2>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '700' }}>{Math.round(weeklySeconds(fitness.logs, me?.id ?? '', today) / 60)}</Text>
          <Muted>/ {fitness.weeklyGoalMin} {copy('train.minutes')}</Muted>
        </Card>
      </View>
      <H2>{copy('train.board')}</H2>
      {fitness.logs.length ? board.map((row) => {
        const m = members.find((x) => x.id === row.memberId);
        return (
          <Card key={row.memberId}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{displayName(m, me)}</Text>
              <Muted>{Math.round(row.seconds / 60)} {copy('train.minutes')}</Muted>
            </Row>
          </Card>
        );
      }) : <Empty icon="trophy-outline" title={copy('train.board')} text={copy('train.boardEmpty')} />}
      <H2>{copy('train.badges')}</H2>
      {fitness.badges.length ? (
        <Row wrap>
          {fitness.badges.map((b) => <Chip key={b.id} label={`${displayName(members.find((m) => m.id === b.memberId), me)} · ${copy(`badge.${b.badge}`)}`} />)}
        </Row>
      ) : <Muted>{copy('train.boardEmpty')}</Muted>}
      <Spacer />
      <H2>{copy('train.challenges')}</H2>
      {fitness.challenges.length ? fitness.challenges.map((c) => (
        <Card key={c.id}>
          <Text style={{ color: t.text, fontWeight: '700' }}>{c.title}</Text>
          <Muted>{c.targetMinutes} {copy('train.minutes')} · {c.weekStart}</Muted>
        </Card>
      )) : <Empty icon="flag-outline" title={copy('train.challenges')} text={copy('train.challengeEmpty')} />}
      <Button variant="secondary" title={copy('train.challengeAdd')} onPress={() => {
        const title = locale === 'en' ? '30 minutes together' : locale === 'de' ? '30 Minuten zusammen' : locale === 'ar' ? '٣٠ دقيقة معًا' : '30 minutes ensemble';
        setFitness((prev) => ({
          ...EMPTY_FITNESS,
          ...prev,
          challenges: [...(prev.challenges ?? []), { id: uid('ch_'), title, weekStart: startOfWeekISO(today), targetMinutes: 30, memberIds: members.map((m) => m.id) }],
        }));
      }} />
      <Spacer />
      <Card>
        <H2>{copy('train.health')}</H2>
        <Muted>{copy('train.healthLead')}</Muted>
        <Spacer h={8} />
        <Muted>
          {fitness.healthStatus === 'granted' ? copy('train.healthGranted') : fitness.healthStatus === 'denied' ? copy('train.healthDenied') : fitness.healthStatus === 'unavailable' ? copy('train.healthUnavailable') : copy('train.healthLead')}
        </Muted>
        {fitness.lastSteps != null ? <Muted>{copy('train.steps')} : {fitness.lastSteps}</Muted> : null}
        <Spacer h={8} />
        <Button variant="secondary" title={copy('train.healthAsk')} onPress={() => {
          void requestHealthPermissions().then(async (status) => {
            const steps = status === 'granted' ? await readHealthSteps(today) : null;
            setFitness((prev) => ({ ...EMPTY_FITNESS, ...prev, healthStatus: status, lastSteps: steps, stepsDay: today }));
          });
        }} />
      </Card>
    </Screen>
  );
}
