import { useRouter } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { useData } from '@/lib/data';
import { downloadText } from '@/lib/download';
import { dayCH, todayISO } from '@/lib/dates';
import { canManage, displayName, ROLE_LABEL, type Role } from '@/lib/model';
import { askPermission, getPermission, type PermState } from '@/lib/reminders';
import { shareInvitation } from '@/lib/share';
import { exportAll } from '@/lib/storage';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Button, Card, Divider, H2, ListItem, Muted, Row, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';
import { theme as t } from '@/ui/theme';


export default function FamilyTab() {
  const { family, members, me, invitations, createInvitation, revokeInvitation, prefs, setPrefs, hasDemo, removeDemo, session, signOut, wipe } = useData();
  const router = useRouter();
  const [role, setRole] = useState<Role>('parent');
  const [perm, setPerm] = useState<PermState>('undetermined');
  useEffect(() => { void getPermission().then(setPerm); }, []);
  const manage = canManage(me?.role);
  const pending = invitations.filter((i) => i.status === 'pending' && i.expiresAt >= todayISO());
  return (
    <Screen>
      <H2>{family?.name}</H2>
      <Card>
        {members.map((m, i) => (
          <Fragment key={m.id}>
            {i ? <Divider /> : null}
            <ListItem
              title={`${displayName(m, me)}${m.isMe ? ' (moi)' : ''}`}
              subtitle={`${ROLE_LABEL[m.role]}${m.isMinor ? ' · mineur protégé' : ''}${m.demo ? ' · démo' : ''}`}
              right={<View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: m.color }} />}
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
        <ListItem icon="settings-outline" title="Configuration Supabase" subtitle={supabaseConfigured ? 'Configuré' : 'Mode démo local'} onPress={() => router.push('/config')} />
        <ListItem icon="download-outline" title="Exporter mes données (JSON)" onPress={async () => downloadText(`familyfit-${todayISO()}.json`, JSON.stringify(await exportAll(), null, 2), 'application/json')} />
        {hasDemo ? <ListItem icon="flask-outline" title="Supprimer les données démo" onPress={() => confirmAsk('Supprimer les données d’exemple ?', removeDemo)} /> : null}
        <ListItem icon="log-out-outline" title="Se déconnecter" subtitle={session?.contact} onPress={signOut} />
        <ListItem icon="trash-outline" title="Supprimer toutes les données" subtitle="Irréversible" onPress={() => confirmAsk('Supprimer définitivement toutes les données de cet appareil ?', () => void wipe())} />
      </Card>
    </Screen>
  );
}
