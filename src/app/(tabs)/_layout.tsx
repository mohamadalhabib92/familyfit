import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { TrialBanner } from '@/components/TrialBanner';
import { useData } from '@/lib/data';
import { routeAfterReady } from '@/lib/gate';
import { supabaseConfigured } from '@/lib/supabase';
import { Ionicons, LoadingState, type IconName } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function TabsLayout() {
  const { ready, storageSlow, reloadStorage, prefs, session, family } = useData();
  if (!ready) return <LoadingState slow={storageSlow} onRetry={reloadStorage} />;
  const dest = routeAfterReady({
    supabaseConfigured,
    hasSession: !!session,
    hasFamily: !!family,
    onboarded: prefs.onboarded,
    trialDeclined: prefs.trialDeclined,
  });
  if (dest === 'trial') return <LoadingState slow onRetry={reloadStorage} />;
  if (dest === 'auth') return <Redirect href="/auth" />;
  if (dest === 'onboarding') return <Redirect href="/onboarding" />;
  const icon = (name: IconName) =>
    function TabIcon({ color, size }: { color: unknown; size: number }) {
      return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />;
    };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TrialBanner />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false,
          tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, minHeight: 60 },
          tabBarActiveTintColor: t.primary, tabBarInactiveTintColor: t.muted, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          sceneStyle: { backgroundColor: t.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Aujourd’hui', tabBarIcon: icon('sunny-outline') }} />
        <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: icon('calendar-outline') }} />
        <Tabs.Screen name="rituals" options={{ title: 'Rituels', tabBarIcon: icon('repeat-outline') }} />
        <Tabs.Screen name="wellness" options={{ title: 'Bien-être', tabBarIcon: icon('leaf-outline') }} />
        <Tabs.Screen name="family" options={{ title: 'Famille', tabBarIcon: icon('people-outline') }} />
      </Tabs>
    </View>
  );
}
