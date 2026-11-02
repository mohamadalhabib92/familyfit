import { Text, View } from 'react-native';
import { confirmAsk } from '@/lib/confirm';
import { downloadText } from '@/lib/download';
import { todayISO } from '@/lib/dates';
import { Button, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export type CorruptKey = { key: string; raw: string };

/** Lecture illisible : on n'écrase pas. Export brut, puis réinitialisation seulement après confirmation. */
export function StorageRecovery({ keys, onRetry, onReset }: { keys: CorruptKey[]; onRetry: () => void; onReset: (keys: string[]) => void }) {
  const names = keys.map((k) => k.key).join(', ');
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: 24 }}>
      <Text accessibilityRole="header" style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>Donnée locale illisible</Text>
      <Muted style={{ marginTop: 8 }}>
        {names} n’a pas pu être lu. Le contenu d’origine est conservé tel quel. Rien n’est remplacé tant que vous ne le confirmez pas.
      </Muted>
      <Button
        title="Exporter le brut"
        icon="download-outline"
        variant="secondary"
        style={{ marginTop: 16 }}
        onPress={() => downloadText(`familyfit-brut-${todayISO()}.json`, JSON.stringify(keys, null, 2), 'application/json')}
      />
      <Button title="Réessayer la lecture" variant="ghost" style={{ marginTop: 8 }} onPress={onRetry} />
      <Button
        title="Réinitialiser ces données"
        variant="danger"
        style={{ marginTop: 8 }}
        onPress={() => confirmAsk(
          `Remplacer ${names} par une valeur vide ? Exportez le brut avant si vous voulez le conserver. Cette étape est irréversible.`,
          () => onReset(keys.map((k) => k.key)),
          'Réinitialiser',
        )}
      />
    </View>
  );
}
