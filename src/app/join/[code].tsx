import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useData } from '@/lib/data';
import { Button, Field, H1, Muted, Notice, Screen, Spacer, Toggle } from '@/ui/kit';

export default function Join() {
  const { code: initial } = useLocalSearchParams<{ code: string }>();
  const { acceptInvitation, session } = useData();
  const router = useRouter();
  const [code, setCode] = useState(initial && initial !== 'code' ? String(initial).toUpperCase() : '');
  const [name, setName] = useState('');
  const [minor, setMinor] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <Screen>
      <H1>Rejoindre une famille</H1>
      <Muted>Saisissez le code reçu. {session ? '' : 'Vous devrez d’abord vous connecter.'}</Muted>
      <Spacer />
      <Field label="Code d’invitation" value={code} onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} autoCapitalize="characters" placeholder="ABC234" />
      <Field label="Prénom" value={name} onChangeText={setName} />
      <Toggle label="Profil d’enfant (mineur)" value={minor} onChange={setMinor} hint="Prénom et couleur uniquement ; rôle « membre » ; aucun contact enregistré. Un parent doit être présent." />
      {res ? <Notice tone={res.ok ? 'success' : 'danger'} title={res.message} /> : null}
      {res?.ok ? (
        <Button title="Voir la famille" onPress={() => router.replace('/family')} />
      ) : (
        <Button title="Rejoindre" icon="enter-outline" disabled={code.length !== 6 || !name.trim()} onPress={async () => setRes(await acceptInvitation(code, name, minor))} />
      )}
    </Screen>
  );
}
