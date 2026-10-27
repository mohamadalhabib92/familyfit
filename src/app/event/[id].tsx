import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Text } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { useData } from '@/lib/data';
import { dayCH, fromISO, isTime, parseDay, todayISO, toMin } from '@/lib/dates';
import { draftConflicts } from '@/lib/events';
import { formatHijri } from '@/lib/hijri';
import { CATEGORIES, displayName, RECURRENCE_LABEL, type FamilyEvent, type Recurrence } from '@/lib/model';
import { scheduleAt } from '@/lib/reminders';
import { uid } from '@/lib/storage';
import { Button, Chip, Field, Muted, Notice, Row, Screen, Segmented, Spacer, Toggle, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function EventEditor() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const { events, setEvents, family, members, me, prefs } = useData();
  const router = useRouter();
  const existing = events.find((e) => e.id === id);
  const [d, setD] = useState<FamilyEvent>(() => existing ?? {
    id: uid('evt_'), familyId: family?.id ?? '', title: '', category: 'family', date: date ?? todayISO(), start: '18:00', end: '19:00',
    allDay: false, memberIds: [], recurrence: 'none', notes: '',
  });
  const [dayTxt, setDayTxt] = useState(dayCH(d.date));
  const [untilTxt, setUntilTxt] = useState(d.until ? dayCH(d.until) : '');
  const [err, setErr] = useState<string | null>(null);
  const up = (p: Partial<FamilyEvent>) => setD((x) => ({ ...x, ...p }));
  const conflicts = useMemo(() => (d.title || d.start ? draftConflicts(d, events) : []), [d, events]);

  const save = async () => {
    const day = parseDay(dayTxt);
    if (!d.title.trim()) return setErr('Donnez un titre à l’événement.');
    if (!day) return setErr('Date invalide — format JJ.MM.AAAA.');
    if (!d.allDay && (!isTime(d.start) || !isTime(d.end))) return setErr('Heures au format HH:MM, par ex. 18:30.');
    if (!d.allDay && toMin(d.end) <= toMin(d.start)) return setErr('L’heure de fin doit suivre l’heure de début.');
    let until: string | undefined;
    if (d.recurrence !== 'none' && untilTxt.trim()) {
      const u = parseDay(untilTxt);
      if (!u || u < day) return setErr('Date de fin de répétition invalide.');
      until = u;
    }
    const final: FamilyEvent = { ...d, title: d.title.trim(), date: day, until };
    setEvents((l) => (existing ? l.map((e) => (e.id === final.id ? final : e)) : [...l, final]));
    if (final.reminderMin != null && !final.allDay && final.recurrence === 'none') {
      const [h, m] = final.start.split(':').map(Number);
      const when = fromISO(final.date); when.setHours(h, m - final.reminderMin, 0, 0);
      if (when.getTime() > Date.now()) await scheduleAt(final.title, `À ${final.start} · ${CATEGORIES.find((c) => c.key === final.category)?.label}`, when);
    }
    router.back();
  };

  const day = parseDay(dayTxt);
  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier l’événement' : 'Nouvel événement' }} />
      {existing?.demo ? <Notice tone="info" title="Événement de démonstration" /> : null}
      <Field label="Titre" value={d.title} onChangeText={(v) => up({ title: v })} placeholder="Dîner chez les grands-parents" autoFocus={!existing} />
      <Text style={styles.label}>Catégorie</Text>
      <Row wrap style={{ marginBottom: 14 }}>
        {CATEGORIES.map((c) => <Chip key={c.key} label={c.label} color={c.color} active={d.category === c.key} onPress={() => up({ category: c.key })} />)}
      </Row>
      <Field label="Date (JJ.MM.AAAA)" value={dayTxt} onChangeText={setDayTxt} hint={day && prefs.showHijri ? formatHijri(fromISO(day), 'fr', prefs.hijriOffset) : undefined} />
      <Toggle label="Toute la journée" value={d.allDay} onChange={(v) => up({ allDay: v })} />
      {!d.allDay ? (
        <Row>
          <Field style={{ minWidth: 100 }} label="Début" value={d.start} onChangeText={(v) => up({ start: v })} placeholder="18:00" />
          <Field style={{ minWidth: 100 }} label="Fin" value={d.end} onChangeText={(v) => up({ end: v })} placeholder="19:00" />
        </Row>
      ) : null}
      <Text style={styles.label}>Qui ? (aucun = toute la famille)</Text>
      <Row wrap style={{ marginBottom: 14 }}>
        {members.map((m) => (
          <Chip key={m.id} label={displayName(m, me)} color={m.color} active={d.memberIds.includes(m.id)}
            onPress={() => up({ memberIds: d.memberIds.includes(m.id) ? d.memberIds.filter((x) => x !== m.id) : [...d.memberIds, m.id] })} />
        ))}
      </Row>
      <Segmented label="Répétition" options={(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((r) => ({ label: RECURRENCE_LABEL[r], value: r }))} value={d.recurrence} onChange={(v) => up({ recurrence: v })} />
      {d.recurrence !== 'none' ? <Field label="Jusqu’au (optionnel, JJ.MM.AAAA)" value={untilTxt} onChangeText={setUntilTxt} /> : null}
      {!d.allDay && d.recurrence === 'none' ? (
        <Segmented label={`Rappel${Platform.OS === 'web' ? ' (app mobile uniquement)' : ''}`} options={[{ label: 'Aucun', value: -1 }, { label: '10 min', value: 10 }, { label: '30 min', value: 30 }, { label: '1 h', value: 60 }]}
          value={d.reminderMin ?? -1} onChange={(v) => up({ reminderMin: v < 0 ? undefined : v })} />
      ) : null}
      <Field label="Notes" value={d.notes} onChangeText={(v) => up({ notes: v })} multiline />
      {conflicts.length ? <Notice tone="warning" title="Conflit d’horaire" text={`Chevauche : ${conflicts.join(', ')}. Vous pouvez quand même enregistrer.`} /> : null}
      {err ? <Text style={{ color: t.danger, marginBottom: 8 }}>{err}</Text> : null}
      <Button title="Enregistrer" icon="checkmark" onPress={save} />
      <Spacer h={8} />
      {existing ? <Button variant="danger" title="Supprimer" onPress={() => confirmAsk(`Supprimer « ${existing.title} »${existing.recurrence !== 'none' ? ' et toutes ses répétitions' : ''} ?`, () => { setEvents((l) => l.filter((e) => e.id !== existing.id)); router.back(); }, 'Supprimer')} /> : null}
      <Muted style={{ fontSize: 12, marginTop: 10 }}>Pas de lieu ni de géolocalisation : FamilyFit ne collecte pas de position.</Muted>
    </Screen>
  );
}
