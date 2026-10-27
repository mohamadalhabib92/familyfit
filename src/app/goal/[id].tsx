import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { useData } from '@/lib/data';
import { displayName, type Goal } from '@/lib/model';
import { uid } from '@/lib/storage';
import { Button, Chip, Field, Muted, Row, Screen, Spacer, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

const PRESETS = [
  { title: 'Bouger ensemble', unit: 'min', weeklyTarget: 150, icon: 'walk-outline' },
  { title: 'Repas sans écran', unit: 'repas', weeklyTarget: 5, icon: 'restaurant-outline' },
  { title: 'Lecture en famille', unit: 'soirées', weeklyTarget: 3, icon: 'book-outline' },
  { title: 'Sortie au grand air', unit: 'sorties', weeklyTarget: 2, icon: 'leaf-outline' },
];

export default function GoalEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, setGoals, setActivities, members, me, family } = useData();
  const router = useRouter();
  const existing = goals.find((g) => g.id === id);
  const [g, setG] = useState<Goal>(() => existing ?? { id: uid('goal_'), familyId: family?.id ?? '', title: '', unit: 'min', weeklyTarget: 60, memberIds: [], icon: 'leaf-outline' });
  const [target, setTarget] = useState(String(g.weeklyTarget));
  const [err, setErr] = useState<string | null>(null);
  const save = () => {
    const n = Number(target.replace(',', '.'));
    if (!g.title.trim()) return setErr('Donnez un nom à l’objectif.');
    if (!Number.isFinite(n) || n <= 0) return setErr('Cible hebdomadaire invalide.');
    const fin = { ...g, title: g.title.trim(), weeklyTarget: n };
    setGoals((l) => (existing ? l.map((x) => (x.id === fin.id ? fin : x)) : [...l, fin]));
    router.back();
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Objectif' : 'Nouvel objectif' }} />
      {!existing ? (
        <>
          <Text style={styles.label}>Idées</Text>
          <Row wrap style={{ marginBottom: 14 }}>
            {PRESETS.map((p) => <Chip key={p.title} label={p.title} active={g.title === p.title} onPress={() => { setG({ ...g, ...p }); setTarget(String(p.weeklyTarget)); }} />)}
          </Row>
        </>
      ) : null}
      <Field label="Objectif" value={g.title} onChangeText={(v) => setG({ ...g, title: v })} />
      <Row>
        <Field style={{ minWidth: 100 }} label="Cible / semaine" value={target} onChangeText={setTarget} keyboardType="numeric" />
        <Field style={{ minWidth: 100 }} label="Unité" value={g.unit} onChangeText={(v) => setG({ ...g, unit: v })} />
      </Row>
      <Text style={styles.label}>Qui participe ? (aucun = tout le monde)</Text>
      <Row wrap style={{ marginBottom: 14 }}>
        {members.map((m) => <Chip key={m.id} label={displayName(m, me)} color={m.color} active={g.memberIds.includes(m.id)} onPress={() => setG({ ...g, memberIds: g.memberIds.includes(m.id) ? g.memberIds.filter((x) => x !== m.id) : [...g.memberIds, m.id] })} />)}
      </Row>
      {err ? <Text style={{ color: t.danger, marginBottom: 8 }}>{err}</Text> : null}
      <Button title="Enregistrer" icon="checkmark" onPress={save} />
      <Spacer h={8} />
      {existing ? <Button variant="danger" title="Supprimer" onPress={() => confirmAsk(`Supprimer « ${existing.title} » et son suivi ?`, () => { setGoals((l) => l.filter((x) => x.id !== existing.id)); setActivities((l) => l.filter((a) => a.goalId !== existing.id)); router.back(); }, 'Supprimer')} /> : null}
      <Muted style={{ fontSize: 12, marginTop: 10 }}>Objectifs de bien-être légers et partagés. Aucun conseil médical ; en cas de question de santé, consultez un professionnel.</Muted>
    </Screen>
  );
}
