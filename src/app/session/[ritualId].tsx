import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { displayName, MOODS, type Session } from '@/lib/model';
import { uid } from '@/lib/storage';
import { Button, Card, Chip, Empty, Field, H1, Ionicons, Muted, Row, Screen, Spacer, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function SessionScreen() {
  const { ritualId } = useLocalSearchParams<{ ritualId: string }>();
  const { rituals, sessions, setSessions, members, me, family } = useData();
  const router = useRouter();
  const r = rituals.find((x) => x.id === ritualId);
  const today = todayISO();
  const prev = sessions.find((s) => s.ritualId === ritualId && s.date === today);
  const [s, setS] = useState<Session>(() => prev ?? { id: uid('ses_'), familyId: family?.id ?? '', ritualId: ritualId ?? '', date: today, slot: r?.slot ?? 'evening', done: [], participants: me ? [me.id] : [] });
  if (!r) return <Screen><Empty icon="help-circle-outline" title="Rituel introuvable" action={<Button small title="Retour" onPress={() => router.back()} />} /></Screen>;
  const toggle = (k: 'done' | 'participants', v: string) => setS((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const persist = (complete: boolean) => {
    const fin = { ...s, completedAt: complete ? new Date().toISOString() : s.completedAt };
    setSessions((l) => (l.some((x) => x.id === fin.id) ? l.map((x) => (x.id === fin.id ? fin : x)) : [...l, fin]));
    router.back();
  };
  const pct = r.items.length ? s.done.length / r.items.length : 0;
  return (
    <Screen>
      <Stack.Screen options={{ title: r.title }} />
      <H1>{r.title}</H1>
      <Muted>{s.done.length} / {r.items.length} étapes{prev?.completedAt ? ' · déjà terminée aujourd’hui' : ''}</Muted>
      <View style={{ height: 8, backgroundColor: t.surfaceAlt, borderRadius: 4, marginVertical: 10 }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: 8, backgroundColor: t.success, borderRadius: 4 }} />
      </View>
      <Card>
        {r.items.map((it) => {
          const on = s.done.includes(it);
          return (
            <Pressable key={it} onPress={() => toggle('done', it)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
              <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={on ? t.success : t.muted} />
              <Text style={{ color: t.text, fontSize: 16, textDecorationLine: on ? 'line-through' : 'none', flex: 1 }}>{it}</Text>
            </Pressable>
          );
        })}
      </Card>
      <Text style={styles.label}>Participants</Text>
      <Row wrap style={{ marginBottom: 14 }}>
        {members.map((m) => <Chip key={m.id} label={displayName(m, me)} color={m.color} active={s.participants.includes(m.id)} onPress={() => toggle('participants', m.id)} />)}
      </Row>
      <Text style={styles.label}>Humeur (optionnel)</Text>
      <Row style={{ marginBottom: 14 }}>
        {MOODS.map((e, i) => {
          const v = (i + 1) as Session['mood'];
          return (
            <Pressable key={e} onPress={() => setS((x) => ({ ...x, mood: x.mood === v ? undefined : v }))} accessibilityLabel={`Humeur ${i + 1} sur 5`}
              style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: s.mood === v ? t.surfaceAlt : 'transparent', borderWidth: s.mood === v ? 2 : 0, borderColor: t.primary }}>
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </Pressable>
          );
        })}
      </Row>
      <Field label="Note (optionnel)" value={s.note ?? ''} onChangeText={(v) => setS({ ...s, note: v })} multiline placeholder="Un moment fort de la journée…" />
      <Button title="Terminer la session" icon="checkmark-done" onPress={() => persist(true)} />
      <Spacer h={8} />
      <Button variant="ghost" title="Enregistrer pour plus tard" onPress={() => persist(false)} />
    </Screen>
  );
}
