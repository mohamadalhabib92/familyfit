import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { isTime } from '@/lib/dates';
import { CATEGORIES, RITUAL_TEMPLATES, ROLE_LABEL, type Category, type Invitation, type Role } from '@/lib/model';
import { shareInvitation } from '@/lib/share';
import { uid } from '@/lib/storage';
import { Button, Card, Chip, Eyebrow, Field, H1, Muted, Notice, Row, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Onboarding() {
  const { family, createFamily, createInvitation, setEvents, setRituals, setPrefs, session, me } = useData();
  const router = useRouter();
  const [step, setStep] = useState(family ? 1 : 0);
  const [fname, setFname] = useState('');
  const [myName, setMyName] = useState('');
  const [withDemo, setWithDemo] = useState(session?.mode === 'demo');
  const [role, setRole] = useState<Role>('parent');
  const [inv, setInv] = useState<Invitation | null>(null);
  const [title, setTitle] = useState('Dîner en famille');
  const [category, setCategory] = useState<Category>('family');
  const [start, setStart] = useState('19:00');
  const [err, setErr] = useState('');
  const [t0] = useState(Date.now());
  const [sec, setSec] = useState(0);
  useEffect(() => { const id = setInterval(() => setSec(Math.round((Date.now() - t0) / 1000)), 1000); return () => clearInterval(id); }, [t0]);

  const finish = () => { setPrefs((p) => ({ ...p, onboarded: true })); router.replace('/'); };

  const steps = ['Famille', 'Inviter', 'Premier événement'];
  return (
    <Screen>
      <Eyebrow>Étape {step + 1} / 3 · {steps[step]}</Eyebrow>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
        {steps.map((s, i) => <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? t.primary : t.border }} />)}
      </View>
      {step === 0 ? (
        <>
          <H1>Créons votre famille</H1>
          <Muted>Moins de 2 minutes : famille → invitation → premier événement.</Muted>
          <Spacer />
          <Field label="Nom de la famille" value={fname} onChangeText={setFname} placeholder="Famille Ba" />
          <Field label="Votre prénom" value={myName} onChangeText={setMyName} placeholder="Mohamed" />
          <Toggle label="Ajouter des données d’exemple" value={withDemo} onChange={setWithDemo} hint="Membres et événements fictifs marqués « démo », supprimables à tout moment." />
          {err ? <Notice tone="danger" title={err} /> : null}
          <Button title="Créer la famille" icon="home-outline" onPress={async () => {
            if (!fname.trim() || !myName.trim()) return setErr('Indiquez le nom de la famille et votre prénom.');
            setErr('');
            await createFamily(fname.trim(), myName.trim(), withDemo);
            setStep(1);
          }} />
        </>
      ) : step === 1 ? (
        <>
          <H1>Invitez un proche</H1>
          <Muted>Un code à 6 caractères, valable 7 jours. Les enfants peuvent être ajoutés plus tard depuis l’onglet Famille (profil mineur protégé).</Muted>
          <Spacer />
          <Segmented label="Rôle de la personne invitée" options={(['parent', 'member', 'admin'] as Role[]).map((r) => ({ label: ROLE_LABEL[r], value: r }))} value={role} onChange={setRole} />
          <Spacer h={8} />
          {inv ? (
            <Card>
              <Muted style={{ fontSize: 12 }}>CODE D’INVITATION · {ROLE_LABEL[inv.role]}</Muted>
              <Text selectable style={{ color: t.primary, fontSize: 30, fontWeight: '800', letterSpacing: 6 }}>{inv.code}</Text>
              <Button small variant="secondary" icon="share-outline" title="Partager" onPress={() => shareInvitation(inv, family?.name ?? '')} />
            </Card>
          ) : (
            <Button title="Générer un code" icon="key-outline" onPress={async () => setInv(await createInvitation(role))} />
          )}
          <Spacer />
          <Row wrap>
            <Button title="Continuer" onPress={() => setStep(2)} />
            {!inv ? <Button variant="ghost" title="Plus tard" onPress={() => setStep(2)} /> : null}
          </Row>
        </>
      ) : (
        <>
          <H1>Premier rendez-vous</H1>
          <Muted>Ajoutez un moment partagé aujourd’hui, ou un rituel prêt à l’emploi.</Muted>
          <Spacer />
          <Field label="Titre" value={title} onChangeText={setTitle} />
          <Row wrap>{CATEGORIES.map((c) => <Chip key={c.key} label={c.label} active={category === c.key} color={c.color} onPress={() => setCategory(c.key)} />)}</Row>
          <Spacer h={8} />
          <Field label="Heure (HH:MM)" value={start} onChangeText={setStart} style={{ width: 120 }} />
          {err ? <Notice tone="danger" title={err} /> : null}
          <Button title="Ajouter et terminer" icon="checkmark" onPress={() => {
            if (!title.trim() || !isTime(start)) return setErr('Titre et heure (HH:MM) requis.');
            const [h, m] = start.split(':').map(Number);
            const end = `${String(Math.min(23, h + 1)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            setEvents((l) => [...l, { id: uid('ev_'), familyId: family!.id, title: title.trim(), category, date: todayISO(), start, end, allDay: false, memberIds: [], recurrence: 'none', notes: '' }]);
            finish();
          }} />
          <Spacer h={8} />
          <Button variant="secondary" icon="repeat-outline" title="Plutôt : rituel « Bilan du soir »" onPress={() => {
            const tpl = RITUAL_TEMPLATES[2];
            setRituals((l) => [...l, { ...tpl, id: uid('rit_'), familyId: family!.id, template: false, reminder: '20:00' }]);
            finish();
          }} />
          <Button variant="ghost" title="Passer" onPress={finish} />
        </>
      )}
      <Spacer h={20} />
      <Muted style={{ fontSize: 12, textAlign: 'center' }}>{me ? `${me.name} · ` : ''}⏱ {Math.floor(sec / 60)} min {String(sec % 60).padStart(2, '0')} s</Muted>
    </Screen>
  );
}
