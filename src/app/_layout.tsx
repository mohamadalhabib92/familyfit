import { useEffect, useState, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StorageRecovery } from '@/components/StorageRecovery';
import { DataProvider, useData } from '@/lib/data';
import { todayISO } from '@/lib/dates';
import { downloadText } from '@/lib/download';
import { installCrashHooks } from '@/lib/sentry';
import { exportSnapshot } from '@/lib/storage';
import { WRITE_FAILURE_MESSAGE } from '@/lib/preservation';
import { AppErrorBoundary } from '@/ui/ErrorBoundary';
import { Button, FontScaleProvider, LoadingState } from '@/ui/kit';
import { isTv } from '@/lib/platform';
import { theme as t } from '@/ui/theme';
import { VisualEffectsProvider } from '@/ui/effects';
import { ThemeProvider, useColorMode } from '@/ui/ThemeProvider';

function Shell({ children }: { children: ReactNode }) {
  const { prefs } = useData();
  return (
    <ThemeProvider scheme={prefs.colorScheme} finish={prefs.finish} haptics={prefs.haptics}>
      <VisualEffectsProvider>
        <FontScaleProvider scale={prefs.largeText ? 1.5 : 1}>{children}</FontScaleProvider>
      </VisualEffectsProvider>
    </ThemeProvider>
  );
}

function WritesPausedBanner() {
  const { writesPaused } = useData();
  const [note, setNote] = useState<string | null>(null);
  const tv = isTv();
  if (!writesPaused) return null;
  return (
    <View style={{ backgroundColor: t.warningBg, paddingHorizontal: tv ? 28 : 16, paddingVertical: tv ? 18 : 12, gap: tv ? 12 : 8 }}>
      <Text accessibilityRole="header" style={[{ color: t.text, fontWeight: '700' }, tv && { fontSize: 28, lineHeight: 34 }]}>Écritures en pause</Text>
      <Text style={{ color: t.text, fontSize: tv ? 22 : 14, lineHeight: tv ? 30 : 20 }}>
        Ces données viennent d’une version plus récente, ou leur métadonnée est illisible. FamilyFit ne les réécrit pas. L’export est un instantané, pas une restauration. La suppression confirmée reste dans Famille.
      </Text>
      <Button
        small
        title="Exporter l’instantané"
        onPress={() => {
          void exportSnapshot().then(async (snap) => {
            await downloadText(`familyfit-${todayISO()}.json`, JSON.stringify(snap, null, 2), 'application/json');
            setNote(`Condensé ${snap.sha256.slice(0, 12)}. Ce fichier ne restaure rien tout seul.`);
          });
        }}
      />
      {note ? <Text style={{ color: t.text, fontSize: tv ? 20 : 13 }}>{note}</Text> : null}
    </View>
  );
}

function UnsavedBanner() {
  const { unsaved, retryUnsaved } = useData();
  const [note, setNote] = useState<string | null>(null);
  const tv = isTv();
  if (!unsaved.length) return null;
  const keys = unsaved.map((row) => row.key).join(', ');
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ backgroundColor: t.dangerBg, paddingHorizontal: tv ? 28 : 16, paddingVertical: tv ? 18 : 12, gap: tv ? 12 : 8 }}>
      <Text accessibilityRole="header" style={[{ color: t.text, fontWeight: '700' }, tv && { fontSize: 28, lineHeight: 34 }]}>Modifications non enregistrées</Text>
      <Text style={{ color: t.text, fontSize: tv ? 22 : 14, lineHeight: tv ? 30 : 20 }}>
        {unsaved[0]?.error ?? WRITE_FAILURE_MESSAGE} Clés : {keys}. L’écran garde vos changements. L’appareil garde l’ancienne copie. Rien n’a été remis à vide.
      </Text>
      <Button small title="Réessayer l’enregistrement" onPress={() => { void retryUnsaved().then(() => setNote(null)); }} />
      <Button
        small
        variant="secondary"
        title="Exporter y compris le non-enregistré"
        onPress={() => {
          void exportSnapshot().then(async (snap) => {
            await downloadText(`familyfit-${todayISO()}.json`, JSON.stringify(snap, null, 2), 'application/json');
            setNote(`Export : disque ${snap.sha256.slice(0, 12)}, ${snap.unsaved.length} brouillon(s). Ce fichier ne restaure rien tout seul.`);
          });
        }}
      />
      {note ? <Text style={{ color: t.text, fontSize: tv ? 20 : 13 }}>{note}</Text> : null}
    </View>
  );
}

function RootNavigator() {
  const { ready, storageSlow, reloadStorage, corrupt, resetCorrupt, resetError } = useData();
  const mode = useColorMode();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {corrupt.length ? (
          <StorageRecovery keys={corrupt} error={resetError} onRetry={reloadStorage} onReset={(keys) => void resetCorrupt(keys)} />
        ) : (
          <LoadingState slow={storageSlow} onRetry={reloadStorage} />
        )}
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <WritesPausedBanner />
      <UnsavedBanner />
      <Stack screenOptions={{ headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="config" options={{ title: 'Diagnostic' }} />
        <Stack.Screen name="auth" options={{ title: 'Connexion' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Votre famille', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="join/[code]" options={{ title: 'Rejoindre une famille' }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Événement' }} />
        <Stack.Screen name="ritual/[id]" options={{ title: 'Rituel' }} />
        <Stack.Screen name="session/[ritualId]" options={{ title: 'Session' }} />
        <Stack.Screen name="member/[id]" options={{ title: 'Membre' }} />
        <Stack.Screen name="goal/[id]" options={{ title: 'Objectif' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Séance' }} />
        <Stack.Screen name="moves/index" options={{ title: 'Mouvements' }} />
        <Stack.Screen name="moves/[part]" options={{ title: 'Mouvements' }} />
        <Stack.Screen name="moves/demo/[id]" options={{ title: 'Démonstration' }} />
        <Stack.Screen name="moves/seance" options={{ title: 'Séance corps complet' }} />
        <Stack.Screen name="moves/seance-play" options={{ title: 'Séance corps complet' }} />
        <Stack.Screen name="tv" options={{ title: 'Salon', headerShown: false }} />
        <Stack.Screen name="privacy" options={{ title: 'Vie privée & mineurs' }} />
      </Stack>
    </View>
  );
}

export default function Layout() {
  useEffect(() => {
    installCrashHooks();
  }, []);
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <DataProvider>
          <Shell>
            <RootNavigator />
          </Shell>
        </DataProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
