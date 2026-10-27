import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { encouragement, weekProgress } from '@/lib/goals';
import { displayName } from '@/lib/model';
import { uid } from '@/lib/storage';
import { Button, Card, Chip, Empty, Ionicons, Muted, Notice, Row, Screen, Spacer, type IconName } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Wellness() {
  const { goals, activities, setActivities, members, me } = useData();
  const router = useRouter();
  const [who, setWho] = useState<string | null>(me?.id ?? null);
  const log = (goalId: string, amount: number) => who && setActivities((l) => [...l, { id: uid('act_'), goalId, memberId: who, date: todayISO(), amount }]);
  return (
    <Screen>
      <Notice tone="info" title="Des repères légers, pas un programme médical" text="Fixez-vous des objectifs simples à partager. FamilyFit ne donne aucun conseil de santé." />
      <Muted>Qui enregistre ?</Muted>
      <Row wrap style={{ marginVertical: 6 }}>
        {members.map((m) => <Chip key={m.id} label={displayName(m, me)} color={m.color} active={who === m.id} onPress={() => setWho(m.id)} />)}
      </Row>
      <Spacer h={6} />
      {goals.length ? (
        goals.map((g) => {
          const p = weekProgress(g, activities);
          const step = g.weeklyTarget >= 60 ? 15 : 1;
          return (
            <Card key={g.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Row style={{ flex: 1 }}>
                  <Ionicons name={(g.icon || 'leaf-outline') as IconName} size={20} color={t.success} />
                  <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{g.title}{g.demo ? ' · démo' : ''}</Text>
                </Row>
                <Button small variant="ghost" title="Modifier" onPress={() => router.push({ pathname: '/goal/[id]', params: { id: g.id } })} />
              </Row>
              <Muted>{p.done} / {g.weeklyTarget} {g.unit} cette semaine</Muted>
              <View style={{ height: 10, backgroundColor: t.surfaceAlt, borderRadius: 5, marginVertical: 8 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(p.pct * 100) }}>
                <View style={{ width: `${Math.round(p.pct * 100)}%`, height: 10, backgroundColor: t.success, borderRadius: 5 }} />
              </View>
              <Muted style={{ fontSize: 13 }}>{encouragement(p.pct)}</Muted>
              <Row wrap style={{ marginTop: 8 }}>
                <Button small variant="secondary" title={`+${step} ${g.unit}`} onPress={() => log(g.id, step)} disabled={!who} />
                {step > 1 ? <Button small variant="secondary" title={`+${step * 2} ${g.unit}`} onPress={() => log(g.id, step * 2)} disabled={!who} /> : null}
              </Row>
            </Card>
          );
        })
      ) : (
        <Empty icon="leaf-outline" title="Aucun objectif" text="Exemple : bouger 150 min ensemble par semaine." />
      )}
      <Button icon="add" title="Nouvel objectif" onPress={() => router.push({ pathname: '/goal/[id]', params: { id: 'new' } })} />
    </Screen>
  );
}
