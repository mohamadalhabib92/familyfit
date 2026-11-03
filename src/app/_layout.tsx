import { useEffect, type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StorageRecovery } from '@/components/StorageRecovery';
import { DataProvider, useData } from '@/lib/data';
import { installCrashHooks } from '@/lib/sentry';
import { AppErrorBoundary } from '@/ui/ErrorBoundary';
import { FontScaleProvider, LoadingState } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

function Shell({ children }: { children: ReactNode }) {
  const { prefs } = useData();
  return <FontScaleProvider scale={prefs.largeText ? 1.5 : 1}>{children}</FontScaleProvider>;
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
