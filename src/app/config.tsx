import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useData } from '@/lib/data';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from '@/lib/supabase';
import { Button, Card, Eyebrow, H1, Muted, Notice, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Config() {
  const { setPrefs, session } = useData();
  const router = useRouter();
  const row = (k: string, ok: boolean) => (
    <Text key={k} style={{ color: t.text, fontFamily: 'monospace', marginBottom: 6 }}>{ok ? '✓' : '○'} {k}={ok ? 'configuré' : `YOUR_${k.replace('EXPO_PUBLIC_', '')}`}</Text>
  );
  return (
    <Screen>
      <Eyebrow>FamilyFit</Eyebrow>
      <H1>{supabaseConfigured ? 'Configuration OK' : 'Configuration requise'}</H1>
      <Muted>Pour synchroniser la famille entre plusieurs téléphones et envoyer de vrais codes à 6 chiffres, FamilyFit utilise votre projet Supabase.</Muted>
      <Spacer />
      <Card>
        {row(SUPABASE_URL.name, SUPABASE_URL.configured)}
        {row(SUPABASE_ANON_KEY.name, SUPABASE_ANON_KEY.configured)}
      </Card>
      {!supabaseConfigured ? (
        <>
          <Notice tone="info" title="Comment configurer" text="Copiez .env.example vers .env, remplacez les valeurs YOUR_* par l’URL et la clé « anon » de votre projet Supabase, exécutez supabase/schema.sql, puis relancez l’app. Le fournisseur e-mail/SMS des codes se règle dans Supabase (Authentication → Providers)." />
          <Notice tone="warning" title="Mode démo disponible" text="Sans configuration, tout fonctionne sur cet appareil (agenda, rituels, bien-être). Le code de connexion est simulé et affiché à l’écran ; les invitations ne fonctionnent que sur cet appareil." />
          <Button title="Continuer en mode démo (local)" icon="phone-portrait-outline" onPress={() => { setPrefs((p) => ({ ...p, configAck: true })); router.replace(session ? '/' : '/auth'); }} />
        </>
      ) : (
        <Button title="Continuer" onPress={() => router.replace('/')} />
      )}
    </Screen>
  );
}
