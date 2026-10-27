import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { useData } from '@/lib/data';
import { canManage, MEMBER_COLORS, ROLE_LABEL, type Member, type Role } from '@/lib/model';
import { uid } from '@/lib/storage';
import { Button, Empty, Field, Notice, Row, Screen, Segmented, Spacer, Toggle, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function MemberEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { members, setMembers, me, family, setEvents } = useData();
  const router = useRouter();
  const existing = members.find((m) => m.id === id);
  const manage = canManage(me?.role);
  const [m, setM] = useState<Member>(() => existing ?? { id: uid('mem_'), familyId: family?.id ?? '', name: '', role: 'member', color: MEMBER_COLORS[members.length % MEMBER_COLORS.length], isMinor: true, parentConsentShare: false });
  const [err, setErr] = useState<string | null>(null);
  if (!manage && !existing?.isMe) return <Screen><Empty icon="lock-closed-outline" title="Réservé aux parents" text="Seuls les parents et administrateurs peuvent modifier les membres." /></Screen>;
  const admins = members.filter((x) => x.role === 'admin');
  const save = () => {
    if (!m.name.trim()) return setErr('Indiquez un prénom.');
    if (existing?.role === 'admin' && m.role !== 'admin' && admins.length <= 1) return setErr('La famille doit garder au moins un administrateur.');
    const fin: Member = { ...m, name: m.name.trim(), contact: m.isMinor ? undefined : m.contact, role: m.isMinor ? 'member' : m.role };
    setMembers((l) => (existing ? l.map((x) => (x.id === fin.id ? fin : x)) : [...l, fin]));
    router.back();
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Membre' : 'Ajouter un enfant' }} />
      <Field label="Prénom (ou surnom)" value={m.name} onChangeText={(v) => setM({ ...m, name: v })} hint="Le prénom suffit : pas de nom de famille, ni date de naissance." />
      {manage && !m.isMe ? <Toggle label="Mineur" value={m.isMinor} onChange={(v) => setM({ ...m, isMinor: v })} hint="Profil protégé : pas de contact, pas de compte, jamais visible publiquement." /> : null}
      {m.isMinor ? (
        <>
          <Toggle label="Consentement parental : afficher le prénom aux membres invités" value={!!m.parentConsentShare} onChange={(v) => manage && setM({ ...m, parentConsentShare: v })} hint="Sinon, les membres non-parents voient « Enfant »." />
          <Notice tone="info" title="Protection des mineurs" text="Aucune géolocalisation, aucune exposition publique, données minimales. Révocable à tout moment." />
        </>
      ) : (
        <>
          {manage && !m.isMe ? <Segmented label="Rôle" options={(['admin', 'parent', 'member'] as Role[]).map((r) => ({ label: ROLE_LABEL[r], value: r }))} value={m.role} onChange={(v) => setM({ ...m, role: v })} /> : null}
          <Field label="Contact (e-mail ou téléphone, optionnel)" value={m.contact ?? ''} onChangeText={(v) => setM({ ...m, contact: v || undefined })} autoCapitalize="none" />
        </>
      )}
      <Text style={styles.label}>Couleur</Text>
      <Row wrap style={{ marginBottom: 14 }}>
        {MEMBER_COLORS.map((c) => (
          <Pressable key={c} onPress={() => setM({ ...m, color: c })} accessibilityLabel={`Couleur ${c}`} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c, borderWidth: m.color === c ? 3 : 0, borderColor: t.text }} />
        ))}
      </Row>
      {err ? <Text style={{ color: t.danger, marginBottom: 8 }}>{err}</Text> : null}
      <Button title="Enregistrer" icon="checkmark" onPress={save} />
      <Spacer h={8} />
      {existing && manage && !existing.isMe ? (
        <Button variant="danger" title="Retirer de la famille" onPress={() => confirmAsk(`Retirer ${existing.name} ? Ses données personnelles seront supprimées de cet appareil.`, () => {
          setMembers((l) => l.filter((x) => x.id !== existing.id));
          setEvents((l) => l.map((e) => ({ ...e, memberIds: e.memberIds.filter((x) => x !== existing.id) })));
          router.back();
        }, 'Retirer')} />
      ) : null}
    </Screen>
  );
}
