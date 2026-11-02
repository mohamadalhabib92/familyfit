import { Pressable, Text, View } from 'react-native';
import { useData } from '@/lib/data';
import { Card, H2, Ionicons, Muted } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

/** Listes d'exemple locales. La synchro partagée viendra dans une passe suivante. */
export function ExampleLists() {
  const { lists, setLists } = useData();
  if (!lists.length) return null;
  const toggle = (listId: string, itemId: string) =>
    setLists((all) => all.map((list) => (list.id === listId ? { ...list, items: list.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)) } : list)));
  return (
    <>
      <H2>Listes</H2>
      {lists.map((list) => (
        <Card key={list.id}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{list.title}</Text>
          <Muted style={{ fontSize: 12, marginBottom: 6 }}>Sur cet appareil{list.demo ? ' · exemple' : ''}</Muted>
          {list.items.map((it) => (
            <Pressable
              key={it.id}
              onPress={() => toggle(list.id, it.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: it.done }}
              accessibilityLabel={`${it.label}${it.qty ? `, quantité ${it.qty}` : ''}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
            >
              <Ionicons name={it.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={it.done ? t.success : t.muted} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 16, textDecorationLine: it.done ? 'line-through' : 'none' }}>{it.label}</Text>
              </View>
              {it.qty ? <Muted>{it.qty}</Muted> : null}
            </Pressable>
          ))}
        </Card>
      ))}
    </>
  );
}
