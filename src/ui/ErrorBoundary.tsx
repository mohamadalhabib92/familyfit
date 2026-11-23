import { Component, Fragment, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { captureException } from '@/lib/sentry';
import { theme as t } from './theme';

type Props = { children: ReactNode };
type State = { error: Error | null; attempt: number };

/** Repli si un écran plante : pas d'écran blanc, les données locales ne sont pas effacées. Réessayer remonte l’arbre. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error): void {
    captureException(error, { source: 'boundary' });
  }

  retry = (): void => {
    this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <View accessibilityLiveRegion="assertive" style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text accessibilityRole="header" style={{ color: t.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
            Un problème est survenu
          </Text>
          <Text style={{ color: t.muted, fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: 8 }}>
            FamilyFit n’a pas pu afficher cet écran. Vos données sur cet appareil sont conservées.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Réessayer"
            onPress={this.retry}
            style={{ marginTop: 20, minHeight: 48, minWidth: 44, paddingHorizontal: 18, borderRadius: 14, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)', borderBottomWidth: 3, borderBottomColor: 'rgba(0,0,0,0.28)', shadowColor: t.shadow, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
          >
            <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 16 }}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
