import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Text } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { useData } from '@/lib/data';
import { isTime } from '@/lib/dates';
import { SLOT_LABEL, type Ritual, type Slot } from '@/lib/model';
import { askPermission, scheduleDaily } from '@/lib/reminders';
import { uid } from '@/lib/storage';
import { Button, Field, IconButton, Muted, Notice, Row, Screen, Segmented, Spacer, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function RitualEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rituals, setRituals, family } = useData();
  const router = useRouter();
  const existing = rituals.find((r) => r.id === id);
  const [r, setR] = useState<Ritual>(() => existing ?? { id: uid('rit_'), familyId: family?.id ?? '', title: '', slot: 'evening', items: [] });
  const [item, setItem] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const add = () => { if (item.trim()) { setR((x) => ({ ...x, items: [...x.items, item.trim()] })); setItem(''); } };
  const save = async () => {
    if (!r.title.trim()) return setErr('Donnez un nom au rituel.');
    if (!r.items.length) return setErr('Ajoutez au moins une étape.');
    if (r.reminder && !isTime(r.reminder)) return setErr('Heure de rappel au format HH:MM.');
    setRituals((l) => (existing ? l.map((x) => (x.id === r.id ? r : x)) : [...l, r]));
    if (r.reminder && Platform.OS !== 'web') {
      const p = await askPermission();
      if (p === 'granted') await scheduleDaily(r.title, `C’est l’heure du rituel du ${SLOT_LABEL[r.slot].toLowerCase()}`, r.reminder);
      else { setInfo('Notifications refusées : le rituel est enregistré sans rappel. Autorisez-les dans les réglages du téléphone.'); return; }
    }
    router.back();
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Modifier le rituel' : 'Nouveau rituel' }} />
      <Field label="Nom" value={r.title} onChangeText={(v) => setR({ ...r, title: v })} placeholder="Bilan du soir" />
      <Segmented label="Moment" options={(['morning', 'evening'] as Slot[]).map((s) => ({ label: SLOT_LABEL[s], value: s }))} value={r.slot} onChange={(v) => setR({ ...r, slot: v })} />
      <Text style={styles.label}>Étapes</Text>
      {r.items.map((it, i) => (
        <Row key={`${it}${i}`} style={{ justifyContent: 'space-between', minHeight: 44 }}>
          <Text style={{ color: t.text, flex: 1 }}>{i + 1}. {it}</Text>
          <IconButton icon="arrow-up" label="Monter" onPress={() => i && setR((x) => { const a = [...x.items]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return { ...x, items: a }; })} />
          <IconButton icon="close" label="Retirer" onPress={() => setR((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))} />
        </Row>
      ))}
      <Row>
        <Field style={{ minWidth: 180 }} label="Nouvelle étape" value={item} onChangeText={setItem} onSubmitEditing={add} placeholder="Gratitude : un merci chacun" />
        <Button small title="Ajouter" onPress={add} />
      </Row>
      <Field label="Rappel quotidien (HH:MM, optionnel)" value={r.reminder ?? ''} onChangeText={(v) => setR({ ...r, reminder: v || undefined })} placeholder="20:30"
        hint={Platform.OS === 'web' ? 'Les rappels fonctionnent dans l’app iOS / Android.' : 'Notification locale, générée sur l’appareil.'} />
      {err ? <Text style={{ color: t.danger, marginBottom: 8 }}>{err}</Text> : null}
      {info ? <Notice tone="warning" title={info} /> : null}
      <Button title="Enregistrer" icon="checkmark" onPress={save} />
      <Spacer h={8} />
      {existing ? <Button variant="danger" title="Supprimer" onPress={() => confirmAsk(`Supprimer le rituel « ${existing.title} » ? L’historique est conservé.`, () => { setRituals((l) => l.filter((x) => x.id !== existing.id)); router.back(); }, 'Supprimer')} /> : null}
      <Muted style={{ fontSize: 12, marginTop: 10 }}>Astuce : 3 à 5 étapes courtes suffisent pour un rituel qui tient.</Muted>
    </Screen>
  );
}
