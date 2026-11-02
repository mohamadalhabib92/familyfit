import { Redirect, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { featureExternalCalSync, featureHealth, supportEmail, teenMinAge } from '@/lib/config';
import { configAccessAllowed } from '@/lib/devGate';
import { sentryEnabled } from '@/lib/crash';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from '@/lib/supabase';
import { Button, Card, Eyebrow, H1, Muted, Notice, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

/** Diagnostic développeur. Jamais montré au premier lancement. Les valeurs des clés ne sont pas affichées. */
export default function Config() {
  const router = useRouter();
  if (!configAccessAllowed()) return <Redirect href="/" />;
  const row = (k: string, ok: boolean) => (
    <Text key={k} style={{ color: t.text, fontFamily: 'monospace', marginBottom: 6 }}>{ok ? '✓' : '○'} {k}={ok ? 'configuré' : 'YOUR_* ou absent'}</Text>
  );
  const mail = supportEmail();
  return (
    <Screen>
      <Eyebrow>FamilyFit</Eyebrow>
      <H1>Diagnostic</H1>
      <Muted>Écran réservé au développement, ou ouvert par le geste documenté (7 appuis en moins de 4 secondes sur le nom de la famille, ou sur le titre de l’écran de connexion). Un utilisateur final ne le voit pas au démarrage.</Muted>
      <Spacer />
      <Card>
        {row(SUPABASE_URL.name, SUPABASE_URL.configured)}
        {row(SUPABASE_ANON_KEY.name, SUPABASE_ANON_KEY.configured)}
        {row('EXPO_PUBLIC_SENTRY_DSN', sentryEnabled())}
        <Text style={{ color: t.text, fontFamily: 'monospace', marginBottom: 6 }}>{featureHealth ? '✓' : '○'} FEATURE_HEALTH={featureHealth ? 'true' : 'false'}</Text>
        <Text style={{ color: t.text, fontFamily: 'monospace', marginBottom: 6 }}>{featureExternalCalSync ? '✓' : '○'} FEATURE_EXTERNAL_CAL_SYNC={featureExternalCalSync ? 'true' : 'false'}</Text>
        <Text style={{ color: t.text, fontFamily: 'monospace', marginBottom: 6 }}>TEEN_MIN_AGE={teenMinAge()} (défaut 16)</Text>
        <Text style={{ color: t.text, fontFamily: 'monospace' }}>SUPPORT={mail ? 'configuré' : 'YOUR_SUPPORT_EMAIL'}</Text>
      </Card>
      {!supabaseConfigured ? (
        <Notice tone="info" title="Mode essai actif" text="Sans clés, ou tant qu’elles valent YOUR_*, l’app reste sur cet appareil. Le fournisseur OTP (YOUR_OTP_PROVIDER) se règle dans Supabase, jamais dans l’app. Aucune clé service_role." />
      ) : (
        <Notice tone="success" title="Supabase configuré" text="La connexion par code à 6 chiffres est réelle. Les valeurs ne sont pas affichées ici." />
      )}
      <Button title="Retour à l’app" onPress={() => router.replace('/')} />
    </Screen>
  );
}
