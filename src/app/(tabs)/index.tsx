import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { EventRow } from '@/components/EventRow';
import { useData } from '@/lib/data';
import { dayLabel, todayISO } from '@/lib/dates';
import { conflictsFor, occurrences } from '@/lib/events';
import { encouragement, weekProgress } from '@/lib/goals';
import { formatHijri } from '@/lib/hijri';
import { SLOT_LABEL, type Slot } from '@/lib/model';
import { Button, Card, DemoBanner, Divider, Empty, Eyebrow, H1, H2, Muted, Notice, Row, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Today() {
  const { family, me, events, rituals, sessions, goals, activities, prefs, hasDemo, session, remoteError } = useData();
  const router = useRouter();
  const today = todayISO();
  const occ = occurrences(events, today, 1);
  const conf = conflictsFor(occ);
  const hour = new Date().getHours();
  const slot: Slot = hour < 14 ? 'morning' : 'evening';
  const slotRituals = rituals.filter((r) => r.slot === slot);
  const doneToday = (rid: string) => sessions.some((s) => s.ritualId === rid && s.date === today && s.completedAt);
  return (
    <Screen>
      {session?.mode === 'demo' ? <DemoBanner text={`Mode démo local${hasDemo ? ' · données d’exemple affichées' : ''}`} /> : null}
      {remoteError ? <Notice tone="warning" title={remoteError} /> : null}
      <Eyebrow>{family?.name}</Eyebrow>
      <H1>{hour < 12 ? 'Bonjour' : hour < 18 ? 'Bel après-midi' : 'Bonsoir'}{me ? `, ${me.name}` : ''}</H1>
      <Muted>{dayLabel(today)}{prefs.showHijri ? ` · ${formatHijri(new Date(), 'fr', prefs.hijriOffset)}` : ''}</Muted>
      <Spacer />
      <H2>Aujourd’hui</H2>
      {occ.length ? (
        <Card>
          {occ.map((e, i) => (
            <Fragment key={e.id}>
              {i ? <Divider /> : null}
              <EventRow e={e} conflicts={conf.get(`${e.id}@${e.day}`)} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} />
            </Fragment>
          ))}
        </Card>
      ) : (
        <Empty icon="calendar-clear-outline" title="Rien de prévu aujourd’hui" text="Un moment ensemble ? Ajoutez un événement ou un rituel." action={<Button small title="Ajouter" icon="add" onPress={() => router.push({ pathname: '/event/[id]', params: { id: 'new' } })} />} />
      )}
      <H2>Session du {SLOT_LABEL[slot].toLowerCase()}</H2>
      {slotRituals.length ? (
        slotRituals.map((r) => (
          <Card key={r.id} onPress={() => router.push({ pathname: '/session/[ritualId]', params: { ritualId: r.id } })}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{r.title}</Text>
                <Muted style={{ fontSize: 13 }}>{r.items.length} étape(s){r.reminder ? ` · rappel ${r.reminder}` : ''}</Muted>
              </View>
              <Text style={{ color: doneToday(r.id) ? t.success : t.primary, fontWeight: '700' }}>{doneToday(r.id) ? '✓ Fait' : 'Commencer →'}</Text>
            </Row>
          </Card>
        ))
      ) : (
        <Empty icon="repeat-outline" title={`Aucun rituel du ${SLOT_LABEL[slot].toLowerCase()}`} action={<Button small variant="secondary" title="Choisir un modèle" onPress={() => router.push('/rituals')} />} />
      )}
      {goals.length ? (
        <>
          <H2>Bien-être cette semaine</H2>
          {goals.slice(0, 3).map((g) => {
            const p = weekProgress(g, activities);
            return (
              <Card key={g.id} onPress={() => router.push('/wellness')}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ color: t.text, fontWeight: '600' }}>{g.title}</Text>
                  <Muted>{p.done} / {g.weeklyTarget} {g.unit}</Muted>
                </Row>
                <View style={{ height: 8, backgroundColor: t.surfaceAlt, borderRadius: 4, marginTop: 8 }}>
                  <View style={{ width: `${Math.round(p.pct * 100)}%`, height: 8, backgroundColor: t.success, borderRadius: 4 }} />
                </View>
                <Muted style={{ fontSize: 12, marginTop: 6 }}>{encouragement(p.pct)}</Muted>
              </Card>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}
