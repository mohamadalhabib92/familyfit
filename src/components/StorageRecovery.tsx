import { Text, View } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { downloadText } from '@/lib/download';
import { todayISO } from '@/lib/dates';
import { Button, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export type CorruptKey = { key: string; raw: string };

/** Lecture illisible : on n'écrase pas. Export brut, puis réinitialisation seulement après confirmation. */
export function StorageRecovery({ keys, onRetry, onReset, error }: { keys: CorruptKey[]; onRetry: () => void; onReset: (keys: string[]) => void; error?: string | null }) {
  const names = keys.map((k) => k.key).join(', ');
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: 24 }}>
      <Text accessibilityRole="header" style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>Donnée locale illisible</Text>
      <Muted style={{ marginTop: 8 }}>
        {names} n’a pas pu être lu. Le contenu d’origine reste sur cet appareil, et une copie est mise de côté si la zone de quarantaine est lisible. Rien n’est remplacé tant que vous ne le confirmez pas. Cette copie part seulement avec « Supprimer toutes les données » ou la suppression du compte.
      </Muted>
      <Button
        title="Exporter le brut"
        icon="download-outline"
        variant="secondary"
        style={{ marginTop: 16 }}
        onPress={() => downloadText(`familyfit-brut-${todayISO()}.json`, JSON.stringify(keys, null, 2), 'application/json')}
      />
      {error ? <Text accessibilityRole="alert" style={{ color: t.danger, marginTop: 12, fontSize: 15, lineHeight: 21 }}>{error}</Text> : null}
      <Button title="Réessayer la lecture" variant="ghost" style={{ marginTop: 8 }} onPress={onRetry} />
      <Button
        title="Réinitialiser ces données"
        variant="danger"
        style={{ marginTop: 8 }}
        onPress={() => confirmAsk(
          `Remplacer ${names} par une valeur vide ? Une copie brute est gardée sur cet appareil jusqu’à un effacement confirmé. Exportez aussi le brut si vous voulez un fichier. Cette étape est irréversible.${keys.some((k) => k.key === 'family') ? ' Réinitialiser family puis repasser par l’onboarding recrée la famille et remplace les listes.' : ''}`,
          () => onReset(keys.map((k) => k.key)),
          'Réinitialiser',
        )}
      />
    </View>
  );
}
