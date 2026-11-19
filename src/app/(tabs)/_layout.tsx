import { Redirect, Tabs } from 'expo-router';
import { translate } from '@/lib/i18n';
import { isTv } from '@/lib/platform';
import { Text, View } from 'react-native';
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
  if (isTv()) return <Redirect href="/tv" />;
  const copy = (key: Parameters<typeof translate>[1]) => translate(prefs.locale, key);
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
          tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, minHeight: 64 },
          tabBarActiveTintColor: t.primary, tabBarInactiveTintColor: t.muted,
          tabBarLabel: ({ color, children }) => (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{ color: typeof color === 'string' ? color : t.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
              {children}
            </Text>
          ),
          sceneStyle: { backgroundColor: t.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: copy('tab.today'), tabBarIcon: icon('sunny-outline') }} />
        <Tabs.Screen name="agenda" options={{ title: copy('tab.agenda'), tabBarIcon: icon('calendar-outline') }} />
        <Tabs.Screen name="rituals" options={{ title: copy('tab.rituals'), tabBarIcon: icon('repeat-outline') }} />
        <Tabs.Screen name="wellness" options={{ title: copy('tab.wellness'), tabBarIcon: icon('leaf-outline') }} />
        <Tabs.Screen name="train" options={{ title: copy('tab.train'), tabBarIcon: icon('fitness-outline') }} />
        <Tabs.Screen name="family" options={{ title: copy('tab.family'), tabBarIcon: icon('people-outline') }} />
      </Tabs>
    </View>
  );
}
