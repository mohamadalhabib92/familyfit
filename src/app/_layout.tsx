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
import { AppErrorBoundary } from '@/ui/ErrorBoundary';
import { Button, FontScaleProvider, LoadingState } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

function Shell({ children }: { children: ReactNode }) {
  const { prefs } = useData();
  return <FontScaleProvider scale={prefs.largeText ? 1.5 : 1}>{children}</FontScaleProvider>;
}

function WritesPausedBanner() {
  const { writesPaused } = useData();
  const [note, setNote] = useState<string | null>(null);
  if (!writesPaused) return null;
  return (
    <View style={{ backgroundColor: t.warningBg, paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
      <Text accessibilityRole="header" style={{ color: t.text, fontWeight: '700' }}>Écritures en pause</Text>
      <Text style={{ color: t.text, fontSize: 14, lineHeight: 20 }}>
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
      {note ? <Text style={{ color: t.text, fontSize: 13 }}>{note}</Text> : null}
    </View>
  );
}

function RootNavigator() {
  const { ready, storageSlow, reloadStorage, corrupt, resetCorrupt } = useData();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        {corrupt.length ? (
          <StorageRecovery keys={corrupt} onRetry={reloadStorage} onReset={(keys) => void resetCorrupt(keys)} />
        ) : (
          <LoadingState slow={storageSlow} onRetry={reloadStorage} />
        )}
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="dark" />
      <WritesPausedBanner />
      <Stack screenOptions={{ headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="config" options={{ title: 'Diagnostic' }} />
        <Stack.Screen name="auth" options={{ title: 'Connexion', headerBackVisible: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Votre famille', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="join/[code]" options={{ title: 'Rejoindre une famille' }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Événement' }} />
        <Stack.Screen name="ritual/[id]" options={{ title: 'Rituel' }} />
        <Stack.Screen name="session/[ritualId]" options={{ title: 'Session' }} />
        <Stack.Screen name="member/[id]" options={{ title: 'Membre' }} />
        <Stack.Screen name="goal/[id]" options={{ title: 'Objectif' }} />
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
