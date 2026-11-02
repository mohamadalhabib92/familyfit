import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installCrashHandler } from '@/lib/crash';
import { useData, DataProvider } from '@/lib/data';
import { BootFallback, BootSpinner, BOOT_TIMEOUT_MS } from '@/ui/boot';
import { AppErrorBoundary } from '@/ui/ErrorBoundary';
import { TypeScale } from '@/ui/type';
import { theme as t } from '@/ui/theme';

export default function Layout() {
  const [bootKey, setBootKey] = useState(0);
  useEffect(() => { installCrashHandler(); }, []);
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <DataProvider key={bootKey}>
          <Shell onRetry={() => setBootKey((n) => n + 1)} />
        </DataProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

function Shell({ onRetry }: { onRetry: () => void }) {
  const { appReady, prefs } = useData();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (appReady) return;
    const id = setTimeout(() => setSlow(true), BOOT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [appReady]);

  if (!appReady) return slow ? <BootFallback onRetry={onRetry} /> : <BootSpinner label="Ouverture de FamilyFit" />;

  return (
    <TypeScale large={!!prefs.largeText}>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar style="dark" />
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
    </TypeScale>
  );
}
