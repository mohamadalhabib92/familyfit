import { Redirect, Tabs } from 'expo-router';
import { useData } from '@/lib/data';
import { supabaseConfigured } from '@/lib/supabase';
import { BootSpinner } from '@/ui/boot';
import { Ionicons, type IconName } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function TabsLayout() {
  const { appReady, prefs, session, family } = useData();
  if (!appReady) return <BootSpinner />;
  // Clés absentes ou placeholders : mode essai local, jamais l'écran technique.
  if (!supabaseConfigured) {
    if (!family && prefs.trialSeed !== 'opt-out') return <BootSpinner label="Préparation du mode essai" />;
    if (!family || !prefs.onboarded) return <Redirect href="/onboarding" />;
    if (!session) return <Redirect href="/auth" />;
  } else {
    if (session?.mode !== 'supabase') return <Redirect href="/auth" />;
    if (!family || !prefs.onboarded) return <Redirect href="/onboarding" />;
  }
  const icon = (name: IconName) =>
    function TabIcon({ color, size }: { color: unknown; size: number }) {
      return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />;
    };
  return (
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
  );
}
