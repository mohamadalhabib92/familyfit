import { useState, type ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import { Pressable, ScrollView, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { TV_SAFE } from '@/lib/tvSurface';
import { useVisualEffects } from '@/ui/effects';
import { glassVeil, glassWash, raisedShadow, useGlassLook } from '@/ui/glass';
import { useReduceMotion } from '@/ui/motion';
import { isDark } from '@/ui/ThemeProvider';
import { theme as t } from '@/ui/theme';

export { TV_SAFE };

type GuideProps = { children?: ReactNode; style?: StyleProp<ViewStyle>; autoFocus?: boolean };

const RN = require('react-native') as { TVFocusGuideView?: (props: GuideProps) => ReactNode };
const TVFocusGuideView = RN.TVFocusGuideView ?? View;

export function TvScreen({ children }: { children: ReactNode }) {
  const glass = useGlassLook();
  return (
    <TVFocusGuideView autoFocus style={{ flex: 1, backgroundColor: t.bg }}>
      {glass ? <View pointerEvents="none" style={{ position: 'absolute', width: 520, height: 520, borderRadius: 260, backgroundColor: glassWash(), top: -160, right: -140 }} /> : null}
      {children}
    </TVFocusGuideView>
  );
}

/** Défilement natif tvOS. Le focus engine amène l’élément visible, sans mesure forcée. */
export function TvScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: TV_SAFE.horizontal,
        paddingTop: TV_SAFE.vertical,
        paddingBottom: TV_SAFE.vertical + 24,
      }}
    >
      {children}
    </ScrollView>
  );
}

export function TvTitle({ children }: { children: ReactNode }) {
  return (
    <View accessibilityRole="header">
      {typeof children === 'string' ? <TvText size={56} weight="800">{children}</TvText> : children}
    </View>
  );
}

export function TvText({ children, size = 28, weight = '600', color = t.text }: { children: ReactNode; size?: number; weight?: '600' | '700' | '800'; color?: string }) {
  const { Text } = require('react-native') as typeof import('react-native');
  return <Text style={{ color, fontSize: size, lineHeight: Math.round(size * 1.25), fontWeight: weight }}>{children}</Text>;
}

/**
 * Un seul habillage focusable. Focus : fond clair, bord épais, échelle 1,08, halo.
 * Hors focus : plus sombre. `preferred` ne s’applique qu’une fois, puis le relâche.
 */
export function TvFocusable({
  children,
  label,
  onPress,
  preferred,
  selected,
  style,
}: {
  children: ReactNode;
  label: string;
  onPress?: () => void;
  preferred?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const [grab, setGrab] = useState(!!preferred);
  const glass = useGlassLook();
  const fx = useVisualEffects();
  const reduce = useReduceMotion();
  const dark = isDark();
  const focusRing = '#F6C453';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      hasTVPreferredFocus={grab}
      onFocus={() => {
        setGrab(false);
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={[
        {
          minHeight: 72,
          borderRadius: 22,
          paddingHorizontal: 22,
          paddingVertical: 16,
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: 1,
          transform: [{ scale: focused ? 1.08 : 1 }],
          backgroundColor: glass ? 'transparent' : focused ? t.surfaceAlt : t.surface,
          borderWidth: focused ? 6 : selected ? 4 : 2,
          borderColor: focused ? focusRing : selected ? t.primary : t.border,
          shadowColor: focused ? focusRing : dark ? '#000000' : '#1D2522',
          shadowOpacity: focused ? 0.95 : 0.2,
          shadowRadius: focused ? 28 : 10,
          shadowOffset: { width: 0, height: focused ? 0 : 4 },
        },
        reduce && { transform: [{ scale: 1 }] },
        !focused && !selected && raisedShadow(false, !reduce),
        style,
      ] as PressableProps['style']}
    >
      {glass && fx.blur ? <BlurView intensity={fx.intensity} tint={dark ? 'dark' : 'light'} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} /> : null}
      {glass ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: glassVeil() }} /> : null}
      {focused ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, backgroundColor: focusRing }} /> : null}
      <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 16, right: 16, height: 6, borderRadius: 3, backgroundColor: focused ? 'rgba(255,255,255,0.55)' : dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.45)' }} />
      {children}
    </Pressable>
  );
}
