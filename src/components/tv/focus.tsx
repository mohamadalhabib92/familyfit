import { createContext, useContext, useState, type ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import { Pressable, ScrollView, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { focusRail, shouldMountFocusRail, TV_FOCUS_COPPER, TV_FOCUS_CREAM, TV_FOCUS_INK, tvFocusBorderWidth, tvFocusScale } from '@/lib/tvFocus';
import { TV_SAFE } from '@/lib/tvSurface';
import { useVisualEffects } from '@/ui/effects';
import { glassVeil, glassWash, raisedShadow, useGlassLook } from '@/ui/glass';
import { useReduceMotion } from '@/ui/motion';
import { isDark } from '@/ui/ThemeProvider';
import { theme as t } from '@/ui/theme';

const FocusInk = createContext<string | null>(null);

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
  const ink = useContext(FocusInk);
  return <Text style={{ color: ink ?? color, fontSize: size, lineHeight: Math.round(size * 1.25), fontWeight: weight }}>{children}</Text>;
}

/** Rangée focusable. Vide : rien n’est monté, donc pas de contrôle à hauteur nulle. */
export function TvRail({ items, children, style }: { items: readonly unknown[] | null | undefined; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const kept = focusRail(items);
  if (!shouldMountFocusRail(kept.length)) return null;
  return <View style={style}>{children}</View>;
}

/**
 * Focus : fond crème, encre sombre, bord cuivre 3 pt, échelle 1,05, ombre.
 * Hors focus : surface ou verre. `preferred` ne s’applique qu’une fois, puis le relâche.
 * onFocus / onBlur suivent le crayon tvOS.
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
  const scale = tvFocusScale(focused, reduce);
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
          borderRadius: 22,
          paddingHorizontal: 22,
          paddingVertical: 16,
          justifyContent: 'center',
          overflow: focused ? 'visible' : 'hidden',
          opacity: 1,
          backgroundColor: glass ? 'transparent' : t.surface,
        },
        !focused && !selected && raisedShadow(false, !reduce),
        style,
        {
          minHeight: 72,
          borderWidth: tvFocusBorderWidth(focused),
          borderColor: focused ? TV_FOCUS_COPPER : selected ? t.primary : t.border,
          backgroundColor: focused ? TV_FOCUS_CREAM : glass ? 'transparent' : t.surface,
          transform: [{ scale }],
          shadowColor: focused ? TV_FOCUS_INK : dark ? '#000000' : '#1D2522',
          shadowOpacity: focused ? 0.4 : 0.2,
          shadowRadius: focused ? 18 : 10,
          shadowOffset: { width: 0, height: focused ? 8 : 4 },
          elevation: focused ? 12 : 2,
        },
      ] as PressableProps['style']}
    >
      {glass && !focused && fx.blur ? <BlurView intensity={fx.intensity} tint={dark ? 'dark' : 'light'} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} /> : null}
      {glass && !focused ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: glassVeil() }} /> : null}
      {!focused ? <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 16, right: 16, height: 6, borderRadius: 3, backgroundColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.45)' }} /> : null}
      <FocusInk.Provider value={focused ? TV_FOCUS_INK : null}>{children}</FocusInk.Provider>
    </Pressable>
  );
}
