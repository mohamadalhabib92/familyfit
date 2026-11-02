import { Redirect, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useData } from '@/lib/data';
import { clearDiagnosticMemory, diagnosticUnlocked } from '@/lib/diagnosticAccess';
import { sentryConfigured } from '@/lib/sentry';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from '@/lib/supabase';
import { env } from '@/lib/config';
import { Button, Card, Eyebrow, H1, LoadingState, Muted, Notice, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

/**
 * Diagnostic réservé au développement ou au geste caché
 * (sept appuis sur le nom de la famille, le titre Famille ou le titre Connexion).
 * Un utilisateur final ne voit pas cet écran : sans clés, l'app démarre en mode essai.
 */
export default function Config() {
  const { ready, prefs, setPrefs } = useData();
  const router = useRouter();
  if (!ready) return <LoadingState />;
  if (!diagnosticUnlocked(prefs.devConfigUnlocked)) return <Redirect href="/" />;
  const support = env('EXPO_PUBLIC_SUPPORT_EMAIL', process.env.EXPO_PUBLIC_SUPPORT_EMAIL);
  const row = (k: string, ok: boolean) => (
    <Text key={k} style={{ color: t.text, marginBottom: 6 }}>{ok ? '✓' : '○'} {k} — {ok ? 'configuré' : 'non configuré'}</Text>
  );
  return (
    <Screen>
      <Eyebrow>FamilyFit</Eyebrow>
      <H1>Diagnostic</H1>
      <Muted>Cet écran n’apparaît pas au démarrage. Les valeurs des clés ne sont pas affichées.</Muted>
      <Spacer />
      <Card>
        {row(SUPABASE_URL.name, SUPABASE_URL.configured)}
        {row(SUPABASE_ANON_KEY.name, SUPABASE_ANON_KEY.configured)}
        {row('EXPO_PUBLIC_SENTRY_DSN', sentryConfigured())}
        {row('EXPO_PUBLIC_SUPPORT_EMAIL', support.configured)}
        <Text style={{ color: t.text, marginBottom: 6 }}>{supabaseConfigured ? '✓' : '○'} Synchronisation — {supabaseConfigured ? 'clés présentes' : 'mode essai local'}</Text>
      </Card>
      {!supabaseConfigured ? (
        <Notice tone="info" title="Mode essai" text="Sans clés, ou tant qu’elles valent YOUR_*, l’app montre une famille d’exemple sur cet appareil. Pour un vrai compte : copier .env.example, remplacer YOUR_SUPABASE_URL et YOUR_SUPABASE_ANON_KEY, exécuter supabase/schema.sql, puis relancer. Le fournisseur des codes (YOUR_OTP_PROVIDER) se règle dans Supabase, pas dans l’app." />
      ) : (
        <Notice tone="success" title="Clés présentes" text="La connexion par code à 6 chiffres est disponible. La copie complète des événements vers le serveur n’est pas encore branchée." />
      )}
      <Muted style={{ fontSize: 13 }}>Geste : sept appuis en moins de 4 secondes sur le nom de la famille (Aujourd’hui), le titre de l’onglet Famille, ou le titre de l’écran Connexion.</Muted>
      <Spacer />
      <Button title="Fermer" onPress={() => router.back()} />
      {!__DEV__ ? (
        <Button variant="ghost" title="Masquer ce diagnostic" onPress={() => { clearDiagnosticMemory(); setPrefs((p) => ({ ...p, devConfigUnlocked: false })); router.replace('/'); }} />
      ) : null}
    </Screen>
  );
}
