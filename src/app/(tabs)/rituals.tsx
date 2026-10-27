import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { Text } from 'react-native';
import { useData } from '@/lib/data';
import { dayLabel } from '@/lib/dates';
import { MOODS, RITUAL_TEMPLATES, SLOT_LABEL, type Slot } from '@/lib/model';
import { uid } from '@/lib/storage';
import { Button, Card, Divider, Empty, H2, ListItem, Muted, Row, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Rituals() {
  const { rituals, setRituals, sessions, family } = useData();
  const router = useRouter();
  const addTpl = (i: number) => {
    const r = { ...RITUAL_TEMPLATES[i], id: uid('rit_'), familyId: family!.id, template: false };
    setRituals((l) => [...l, r]);
  };
  const hist = [...sessions].filter((s) => s.completedAt).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  return (
    <Screen>
      {(['morning', 'evening'] as Slot[]).map((slot) => {
        const list = rituals.filter((r) => r.slot === slot);
        return (
          <Fragment key={slot}>
            <H2>{slot === 'morning' ? '☀︎' : '☾'} {SLOT_LABEL[slot]}</H2>
            {list.length ? (
              <Card>
                {list.map((r, i) => (
                  <Fragment key={r.id}>
                    {i ? <Divider /> : null}
                    <ListItem icon="repeat-outline" title={`${r.title}${r.demo ? ' · démo' : ''}`} subtitle={`${r.items.length} étape(s)${r.reminder ? ` · rappel ${r.reminder}` : ''}`} onPress={() => router.push({ pathname: '/ritual/[id]', params: { id: r.id } })}
                      right={<Button small variant="secondary" title="Lancer" onPress={() => router.push({ pathname: '/session/[ritualId]', params: { ritualId: r.id } })} />} />
                  </Fragment>
                ))}
              </Card>
            ) : (
              <Muted style={{ marginBottom: 12 }}>Aucun rituel du {SLOT_LABEL[slot].toLowerCase()}.</Muted>
            )}
          </Fragment>
        );
      })}
      <Row wrap>
        <Button small icon="add" title="Rituel personnalisé" onPress={() => router.push({ pathname: '/ritual/[id]', params: { id: 'new' } })} />
      </Row>
      <Spacer />
      <H2>Modèles</H2>
      <Card>
        {RITUAL_TEMPLATES.map((r, i) => (
          <Fragment key={r.title}>
            {i ? <Divider /> : null}
            <ListItem icon={r.slot === 'morning' ? 'sunny-outline' : 'moon-outline'} title={r.title} subtitle={`${SLOT_LABEL[r.slot]} · ${r.items.join(' · ')}`} right={<Button small variant="ghost" icon="add" title="Ajouter" onPress={() => addTpl(i)} />} />
          </Fragment>
        ))}
      </Card>
      <H2>Historique</H2>
      {hist.length ? (
        <Card>
          {hist.map((s, i) => {
            const r = rituals.find((x) => x.id === s.ritualId);
            return (
              <Fragment key={s.id}>
                {i ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
                  <Text style={{ color: t.text, flex: 1 }}>{dayLabel(s.date)} · {r?.title ?? 'Rituel supprimé'} · {s.done.length}/{r?.items.length ?? s.done.length}</Text>
                  <Text style={{ fontSize: 18 }}>{s.mood ? MOODS[s.mood - 1] : ''}</Text>
                </Row>
              </Fragment>
            );
          })}
        </Card>
      ) : (
        <Empty icon="time-outline" title="Pas encore de session" text="Lancez un rituel pour commencer l’historique." />
      )}
    </Screen>
  );
}
