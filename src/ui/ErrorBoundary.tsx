import { Component, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { captureException } from '@/lib/sentry';
import { theme as t } from './theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Repli si un écran plante : pas d'écran blanc, les données locales ne sont pas effacées. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    captureException(error, { source: 'boundary' });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text accessibilityRole="header" style={{ color: t.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Un problème est survenu
        </Text>
        <Text style={{ color: t.muted, fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: 8 }}>
          FamilyFit n’a pas pu afficher cet écran. Vos données sur cet appareil sont conservées.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          onPress={() => this.setState({ error: null })}
          style={{ marginTop: 20, minHeight: 48, minWidth: 44, paddingHorizontal: 18, borderRadius: 14, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 16 }}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
}
