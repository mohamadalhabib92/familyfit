import { useRouter } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { useData } from '@/lib/data';
import { downloadText } from '@/lib/download';
import { dayCH, todayISO } from '@/lib/dates';
import { canManage, displayName, ROLE_LABEL, type Role } from '@/lib/model';
import { askPermission, getPermission, type PermState } from '@/lib/reminders';
import { shareInvitation } from '@/lib/share';
import { exportAll } from '@/lib/storage';
import { supabaseConfigured } from '@/lib/supabase';
import { registerSecretTap } from '@/lib/devGate';
import { supportEmail } from '@/lib/config';
import { Badge, Button, Card, Divider, H2, ListItem, MemberMark, Muted, Notice, Row, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';
import { theme as t } from '@/ui/theme';


export default function FamilyTab() {
  const { family, members, me, invitations, createInvitation, revokeInvitation, prefs, setPrefs, hasDemo, removeDemo, session, signOut, wipe, deleteAccount } = useData();
  const router = useRouter();
  const [role, setRole] = useState<Role>('parent');
  const [perm, setPerm] = useState<PermState>('undetermined');
  useEffect(() => { void getPermission().then(setPerm); }, []);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);
  const manage = canManage(me?.role);
  const mail = supportEmail();
  const tell = (msg: string) => {
    setAccountMsg(msg);
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.alert(msg); return; }
    Alert.alert('FamilyFit', msg);
  };
  const pending = invitations.filter((i) => i.status === 'pending' && i.expiresAt >= todayISO());
  return (
    <Screen>
      <Text accessibilityRole="header" onPress={() => { if (registerSecretTap()) router.push('/config'); }} style={{ color: t.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{family?.name}</Text>
      <Card>
        {members.map((m, i) => (
          <Fragment key={m.id}>
            {i ? <Divider /> : null}
            <ListItem
              title={`${displayName(m, me)}${m.isMe ? ' (moi)' : ''}`}
              subtitle={`${ROLE_LABEL[m.role]}${m.isMinor ? ' · mineur protégé' : ''}${m.demo ? ' · démo' : ''}`}
              right={<MemberMark color={m.color} size={28} />}
              onPress={manage || m.isMe ? () => router.push({ pathname: '/member/[id]', params: { id: m.id } }) : undefined}
            />
          </Fragment>
        ))}
      </Card>
      {manage ? (
        <>
          <Button small variant="secondary" icon="person-add-outline" title="Ajouter un enfant (sans compte)" onPress={() => router.push({ pathname: '/member/[id]', params: { id: 'new' } })} />
          <Spacer />
          <H2>Inviter</H2>
          <Segmented options={(['parent', 'member', 'admin'] as Role[]).map((r) => ({ label: ROLE_LABEL[r], value: r }))} value={role} onChange={setRole} />
          <Spacer h={8} />
          <Row wrap>
            <Button icon="key-outline" title="Créer une invitation" onPress={async () => { const inv = await createInvitation(role); void shareInvitation(inv, family?.name ?? ''); }} />
            <Button variant="ghost" icon="enter-outline" title="J’ai un code" onPress={() => router.push({ pathname: '/join/[code]', params: { code: 'code' } })} />
          </Row>
          {!supabaseConfigured ? <Muted style={{ fontSize: 12, marginTop: 6 }}>Mode démo : un code ne peut être accepté que sur cet appareil.</Muted> : null}
          {pending.length ? (
            <Card style={{ marginTop: 10 }}>
              {pending.map((inv, i) => (
                <Fragment key={inv.id}>
                  {i ? <Divider /> : null}
                  <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
                    <View>
                      <Text selectable style={{ color: t.text, fontWeight: '800', letterSpacing: 3, fontSize: 18 }}>{inv.code}</Text>
                      <Muted style={{ fontSize: 12 }}>{ROLE_LABEL[inv.role]} · jusqu’au {dayCH(inv.expiresAt)}</Muted>
                    </View>
                    <Row>
                      <Button small variant="ghost" icon="share-outline" title="Partager" onPress={() => shareInvitation(inv, family?.name ?? '')} />
                      <Button small variant="ghost" icon="close" title="Révoquer" onPress={() => revokeInvitation(inv.id)} />
                    </Row>
                  </Row>
                </Fragment>
              ))}
            </Card>
          ) : null}
        </>
      ) : (
        <Button variant="ghost" icon="enter-outline" title="J’ai un code d’invitation" onPress={() => router.push({ pathname: '/join/[code]', params: { code: 'code' } })} />
      )}
      <Spacer />
      <H2>Réglages</H2>
      <Toggle label="Afficher la date hégirienne" value={prefs.showHijri} onChange={(v) => setPrefs((p) => ({ ...p, showHijri: v }))} />
      <Toggle label="Texte large" value={!!prefs.largeText} onChange={(v) => setPrefs((p) => ({ ...p, largeText: v }))} hint="Pour lire plus confortablement. Le réglage du téléphone (jusqu’à 200 %) s’y ajoute." />
      {prefs.showHijri ? (
        <Segmented label="Ajustement hégirien (jours, observation locale)" options={[-2, -1, 0, 1, 2].map((n) => ({ label: n > 0 ? `+${n}` : String(n), value: n }))} value={prefs.hijriOffset} onChange={(v) => setPrefs((p) => ({ ...p, hijriOffset: v }))} />
      ) : null}
      <Spacer h={8} />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ color: t.text, fontWeight: '600' }}>Rappels locaux</Text>
          <Badge label={perm === 'granted' ? 'Autorisés' : perm === 'denied' ? 'Refusés' : perm === 'unsupported' ? 'App mobile' : 'À autoriser'} tone={perm === 'granted' ? 'success' : perm === 'denied' ? 'danger' : 'neutral'} />
        </Row>
        <Muted style={{ fontSize: 13, marginTop: 4 }}>
          {perm === 'unsupported' ? 'Les rappels fiables nécessitent l’app iOS / Android. La version web n’envoie pas de rappels.' : perm === 'denied' ? 'Autorisez les notifications dans les réglages du téléphone.' : 'Rappels des rituels et événements, générés sur l’appareil.'}
        </Muted>
        {perm === 'undetermined' ? <Button small title="Autoriser" onPress={async () => setPerm(await askPermission())} style={{ marginTop: 8 }} /> : null}
      </Card>
      <Card>
        <ListItem icon="shield-checkmark-outline" title="Vie privée & mineurs" onPress={() => router.push('/privacy')} />
        {__DEV__ ? <ListItem icon="settings-outline" title="Diagnostic" subtitle={supabaseConfigured ? 'Supabase configuré' : 'Mode essai'} onPress={() => router.push('/config')} /> : null}
        {!supabaseConfigured ? <ListItem icon="key-outline" title="Connexion simulée" subtitle="Code à 6 chiffres affiché à l’écran" onPress={() => router.push('/auth')} /> : null}
        <ListItem icon="download-outline" title="Exporter mes données (JSON)" onPress={async () => downloadText(`familyfit-${todayISO()}.json`, JSON.stringify(await exportAll(), null, 2), 'application/json')} />
        {hasDemo ? <ListItem icon="flask-outline" title="Supprimer les données d’exemple" onPress={() => confirmAsk('Supprimer les données d’exemple ?', removeDemo)} /> : null}
        <ListItem icon="log-out-outline" title="Se déconnecter" subtitle={session?.mode === 'supabase' ? session.contact : 'Mode essai'} onPress={signOut} />
        <ListItem icon="trash-outline" title="Supprimer les données de cet appareil" subtitle="Ne supprime pas un compte en ligne" onPress={() => confirmAsk('Effacer les données stockées sur cet appareil ?', () => void wipe())} />
        <ListItem icon="person-remove-outline" title="Supprimer mon compte" subtitle="Apple 5.1.1 · irréversible" onPress={() => confirmAsk(session?.mode === 'supabase'
          ? 'Supprimer le compte et les données de cet appareil ? Si vous êtes le seul administrateur, le rôle passe à un autre adulte. S’il n’y en a pas, la famille est supprimée.'
          : 'Il n’y a pas de compte en ligne. Cela efface les données de cet appareil.', () => { void deleteAccount().then((r) => tell(r.message)); }, 'Supprimer mon compte')} />
      </Card>
      {accountMsg ? <Notice tone="info" title={accountMsg} /> : null}
      <Muted style={{ fontSize: 12 }}>{mail ? `Support : ${mail}` : 'Support : YOUR_SUPPORT_EMAIL (à renseigner par Mohamed).'}</Muted>
    </Screen>
  );
}
