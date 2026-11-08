import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useData } from '@/lib/data';
import { confirmAsk } from '@/lib/confirm';
import { supabaseConfigured } from '@/lib/supabase';
import { Button } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

/** Bandeau discret. Jamais un écran technique. */
export function TrialBanner() {
  const { prefs, session, keepTrialData, restartKeepingSession } = useData();
  const router = useRouter();
  const [restartMsg, setRestartMsg] = useState<string | null>(null);
  if (session?.mode === 'supabase' && prefs.trialMode) {
    return (
      <View style={{ backgroundColor: t.infoBg, paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        <Text style={{ color: t.info, fontSize: 13, fontWeight: '700' }}>Compte connecté</Text>
        <Text style={{ color: t.text, fontSize: 13, lineHeight: 18 }}>
          Conserver les données d’essai sur cet appareil ? Elles ne sont pas envoyées tant que la synchronisation des événements n’est pas en place.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button small title="Conserver" onPress={keepTrialData} />
          <Button
            small
            variant="ghost"
            title="Recommencer"
            onPress={() => confirmAsk('Effacer les données d’essai et recréer la famille ? Le compte reste connecté.', () => {
              void restartKeepingSession().then((r) => {
                setRestartMsg(r.message);
                if (r.ok) router.replace('/onboarding');
              });
            })}
          />
        </View>
        {restartMsg ? <Text accessibilityRole="alert" style={{ color: t.text, fontSize: 13 }}>{restartMsg}</Text> : null}
      </View>
    );
  }
  if (!prefs.trialMode && supabaseConfigured) return null;
  if (!prefs.trialMode) {
    return (
      <View style={{ backgroundColor: t.surfaceAlt, paddingHorizontal: 16, paddingVertical: 8 }}>
        <Text style={{ color: t.muted, fontSize: 12, fontWeight: '600' }}>Vos données restent sur cet appareil</Text>
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: t.warningBg, paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
      <Text style={{ color: t.warning, fontSize: 13, fontWeight: '700' }}>Mode essai — vos données restent sur cet appareil</Text>
      <Button
        small
        variant="secondary"
        title="Créer ma vraie famille"
        onPress={() => {
          if (supabaseConfigured) router.push({ pathname: '/auth', params: { next: 'migrate' } });
          else router.push({ pathname: '/onboarding', params: { replace: '1' } });
        }}
      />
    </View>
  );
}
