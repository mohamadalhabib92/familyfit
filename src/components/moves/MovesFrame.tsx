import { Stack, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { TvFocusable, TvScreen, TvText } from '@/components/tv/focus';
import { useTvMenu } from '@/components/tv/useTvMenu';
import { isTv } from '@/lib/platform';
import { TV_SAFE } from '@/lib/tvSurface';
import { H1, Muted, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

/** Colonne téléphone, ou plein écran 10 pieds avec Retour focusable. */
export function MovesFrame({ title, subtitle, backLabel, children }: { title: string; subtitle?: string; backLabel: string; children: ReactNode }) {
  const router = useRouter();
  const tv = isTv();
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/tv');
  };
  useTvMenu(tv, 'session', back);
  if (!tv) {
    return (
      <Screen>
        <Stack.Screen options={{ title, headerShown: true }} />
        <H1>{title}</H1>
        {subtitle ? <Muted>{subtitle}</Muted> : null}
        <Spacer />
        {children}
      </Screen>
    );
  }
  return (
    <TvScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical, gap: 22 }}>
        <TvFocusable label={backLabel} onPress={back} style={{ alignSelf: 'flex-start', minWidth: 240 }}>
          <TvText size={26} weight="800" color="#1D2522">{backLabel}</TvText>
        </TvFocusable>
        <View style={{ gap: 8 }}>
          <TvText size={48} weight="800">{title}</TvText>
          {subtitle ? <TvText size={24} color={t.muted}>{subtitle}</TvText> : null}
        </View>
        {children}
      </ScrollView>
    </TvScreen>
  );
}
