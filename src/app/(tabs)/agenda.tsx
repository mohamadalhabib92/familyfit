import { useRouter } from 'expo-router';
import { Fragment, useState } from 'react';
import { Text, View } from 'react-native';
import { EventRow } from '@/components/EventRow';
import { useData } from '@/lib/data';
import { addDays, dayLabel, fromISO, startOfWeek, todayISO } from '@/lib/dates';
import { conflictsFor, occurrences } from '@/lib/events';
import { formatHijri } from '@/lib/hijri';
import { CATEGORIES, displayName } from '@/lib/model';
import { Button, Card, Chip, Divider, Empty, IconButton, Muted, Row, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Agenda() {
  const { events, members, me, prefs, setPrefs } = useData();
  const router = useRouter();
  const [week, setWeek] = useState(startOfWeek(todayISO()));
  const fc = prefs.filterCats, fm = prefs.filterMembers;
  const toggle = (k: 'filterCats' | 'filterMembers', v: string) => setPrefs((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const all = occurrences(events, week, 7);
  const conf = conflictsFor(all);
  const list = all.filter((e) => (!fc.length || fc.includes(e.category)) && (!fm.length || !e.memberIds.length || e.memberIds.some((m) => fm.includes(m))));
  const nConf = list.filter((e) => conf.has(`${e.id}@${e.day}`)).length;
  const end = addDays(week, 6);
  const today = todayISO();
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-back" label="Semaine précédente" onPress={() => setWeek(addDays(week, -7))} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{dayLabel(week)} – {dayLabel(end)}</Text>
          {prefs.showHijri ? <Muted style={{ fontSize: 12 }}>{formatHijri(fromISO(week), 'fr', prefs.hijriOffset)} – {formatHijri(fromISO(end), 'fr', prefs.hijriOffset)}</Muted> : null}
        </View>
        <IconButton icon="chevron-forward" label="Semaine suivante" onPress={() => setWeek(addDays(week, 7))} />
      </Row>
      <Row wrap style={{ marginTop: 8 }}>
        {week !== startOfWeek(today) ? <Button small variant="ghost" title="Cette semaine" onPress={() => setWeek(startOfWeek(today))} /> : null}
        <Button small icon="add" title="Événement" onPress={() => router.push({ pathname: '/event/[id]', params: { id: 'new' } })} />
      </Row>
      <Spacer h={8} />
      <Row wrap>
        {CATEGORIES.map((c) => <Chip key={c.key} label={c.label} color={c.color} active={fc.includes(c.key)} onPress={() => toggle('filterCats', c.key)} />)}
      </Row>
      <Row wrap style={{ marginTop: 6 }}>
        {members.map((m) => <Chip key={m.id} label={displayName(m, me)} color={m.color} active={fm.includes(m.id)} onPress={() => toggle('filterMembers', m.id)} />)}
      </Row>
      {fc.length || fm.length ? <Button small variant="ghost" title="Effacer les filtres" onPress={() => setPrefs((p) => ({ ...p, filterCats: [], filterMembers: [] }))} /> : null}
      <Spacer />
      {nConf ? <Text style={{ color: t.danger, fontWeight: '600', marginBottom: 8 }}>⚠ {nConf} événement(s) en conflit cette semaine</Text> : null}
      {list.length ? (
        Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((d) => {
          const day = list.filter((e) => e.day === d);
          if (!day.length) return null;
          return (
            <Fragment key={d}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: d === today ? t.primary : t.text, fontWeight: '700' }}>{d === today ? 'Aujourd’hui · ' : ''}{dayLabel(d)}</Text>
                {prefs.showHijri ? <Muted style={{ fontSize: 12 }}>{formatHijri(fromISO(d), 'fr', prefs.hijriOffset)}</Muted> : null}
              </Row>
              <Card>
                {day.map((e, i) => (
                  <Fragment key={e.id}>
                    {i ? <Divider /> : null}
                    <EventRow e={e} conflicts={conf.get(`${e.id}@${e.day}`)} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} />
                  </Fragment>
                ))}
              </Card>
            </Fragment>
          );
        })
      ) : (
        <Empty
          icon="calendar-clear-outline"
          title={fc.length || fm.length ? 'Aucun événement avec ces filtres' : 'Aucun événement cette semaine'}
          text="Ajouter un rituel ? Un moment régulier aide toute la famille."
          action={<Row wrap><Button small title="Ajouter un rituel" onPress={() => router.push('/rituals')} /><Button small variant="secondary" title="Événement" onPress={() => router.push({ pathname: '/event/[id]', params: { id: 'new' } })} /></Row>}
        />
      )}
    </Screen>
  );
}
