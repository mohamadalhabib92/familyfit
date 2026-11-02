import { Component, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { reportCrash } from '@/lib/crash';
import { theme as t } from './theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Filet de rendu : pas d'écran blanc si un écran jette. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    reportCrash(error, 'error-boundary');
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text accessibilityRole="header" style={{ color: t.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
          Quelque chose s’est mal passé
        </Text>
        <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
          L’écran n’a pas pu s’afficher. Vos données sur cet appareil n’ont pas été effacées.
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => this.setState({ error: null })}
          style={{ color: t.onPrimary, backgroundColor: t.primary, overflow: 'hidden', paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14, fontWeight: '700', fontSize: 16, minHeight: t.hit }}
        >
          Réessayer
        </Text>
      </View>
    );
  }
}
