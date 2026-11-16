import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { theme as t } from '@/ui/theme';

/** Marges de sécurité 10 pieds pour un écran 1920×1080. */
export const TV_SAFE = { horizontal: 90, vertical: 60 };

type GuideProps = { children?: ReactNode; style?: StyleProp<ViewStyle>; autoFocus?: boolean };

const RN = require('react-native') as { TVFocusGuideView?: (props: GuideProps) => ReactNode };
const TVFocusGuideView = RN.TVFocusGuideView ?? View;

type ScrollTo = (windowY: number) => void;
const ScrollContext = createContext<ScrollTo | null>(null);
type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };

export function TvScreen({ children }: { children: ReactNode }) {
  return (
    <TVFocusGuideView autoFocus style={{ flex: 1, backgroundColor: t.bg }}>
      {children}
    </TVFocusGuideView>
  );
}

export function TvScroll({ children }: { children: ReactNode }) {
  const scroller = useRef<{ scrollTo: (opts: { y: number; animated?: boolean }) => void } | null>(null);
  const offset = useRef(0);
  const scrollTo = useCallback<ScrollTo>((windowY) => {
    if (windowY >= TV_SAFE.vertical && windowY <= 1080 - TV_SAFE.vertical - 120) return;
    scroller.current?.scrollTo({ y: Math.max(0, offset.current + windowY - 220), animated: true });
  }, []);
  return (
    <ScrollContext.Provider value={scrollTo}>
      <ScrollView
        ref={(el) => { scroller.current = el as unknown as { scrollTo: (opts: { y: number; animated?: boolean }) => void } | null; }}
        onScroll={(e) => { offset.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: t.bg }}
        contentContainerStyle={{
          paddingHorizontal: TV_SAFE.horizontal,
          paddingTop: TV_SAFE.vertical,
          paddingBottom: TV_SAFE.vertical + 24,
        }}
      >
        {children}
      </ScrollView>
    </ScrollContext.Provider>
  );
}

export function TvTitle({ children }: { children: ReactNode }) {
  return (
    <View accessibilityRole="header">
      {typeof children === 'string' ? (
        <Pressable accessible={false} style={{ marginBottom: 8 }}>
          <TvText size={56} weight="800">{children}</TvText>
        </Pressable>
      ) : children}
    </View>
  );
}

export function TvText({ children, size = 28, weight = '600', color = t.text }: { children: ReactNode; size?: number; weight?: '600' | '700' | '800'; color?: string }) {
  const { Text } = require('react-native') as typeof import('react-native');
  return <Text style={{ color, fontSize: size, lineHeight: Math.round(size * 1.25), fontWeight: weight }}>{children}</Text>;
}

/**
 * Un seul habillage focusable. Focus : fond clair, bord épais, échelle 1,08, halo.
 * Hors focus : plus sombre. Le premier élément peut prendre le focus au chargement.
 */
export function TvFocusable({
  children,
  label,
  onPress,
  preferred,
  style,
}: {
  children: ReactNode;
  label: string;
  onPress?: () => void;
  preferred?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const node = useRef<Measurable | null>(null);
  const scrollTo = useContext(ScrollContext);
  return (
    <Pressable
      ref={(el) => { node.current = el as unknown as Measurable | null; }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hasTVPreferredFocus={preferred}
      onFocus={() => {
        setFocused(true);
        node.current?.measureInWindow((_x, y) => scrollTo?.(y));
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
          opacity: focused ? 1 : 0.62,
          transform: [{ scale: focused ? 1.08 : 1 }],
          backgroundColor: focused ? '#F4E7C8' : t.surface,
          borderWidth: focused ? 6 : 2,
          borderColor: focused ? '#F6C453' : t.border,
          shadowColor: '#F6C453',
          shadowOpacity: focused ? 0.95 : 0,
          shadowRadius: focused ? 28 : 0,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ] as PressableProps['style']}
    >
      {children}
    </Pressable>
  );
}
