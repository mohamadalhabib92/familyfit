import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useData } from '@/lib/data';
import { supabaseConfigured } from '@/lib/supabase';
import { Ionicons, type IconName } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function TabsLayout() {
  const { ready, prefs, session, family } = useData();
  if (!ready)
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} accessibilityLabel="Chargement" />
      </View>
    );
  if (!supabaseConfigured && !prefs.configAck) return <Redirect href="/config" />;
  if (!session) return <Redirect href="/auth" />;
  if (!family || !prefs.onboarded) return <Redirect href="/onboarding" />;
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
