import { ActivityIndicator, Text, View } from 'react-native';
import { theme as t } from './theme';

export const BOOT_TIMEOUT_MS = 8000;

export function BootSpinner({ label = 'Chargement' }: { label?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator color={t.primary} accessibilityLabel={label} />
      <Text style={{ color: t.muted, marginTop: 12, fontSize: 15 }}>{label}</Text>
    </View>
  );
}

/** Repli si le stockage local ne répond pas : pas de spinner infini, pas d'écran blanc. */
export function BootFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text accessibilityRole="header" style={{ color: t.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
        Chargement interrompu
      </Text>
      <Text style={{ color: t.muted, fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
        La lecture des données locales prend trop de temps. Rien n’a été effacé. Vérifiez l’espace de l’appareil, puis réessayez.
      </Text>
      <Text
        accessibilityRole="button"
        onPress={onRetry}
        style={{ color: t.onPrimary, backgroundColor: t.primary, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14, fontWeight: '700', fontSize: 16 }}
      >
        Réessayer
      </Text>
    </View>
  );
}
