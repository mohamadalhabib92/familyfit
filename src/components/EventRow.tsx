import { Pressable, Text, View } from 'react-native';
import { useData } from '@/lib/data';
import type { Occurrence } from '@/lib/events';
import { cat, displayName } from '@/lib/model';
import { Ionicons, type IconName } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export function EventRow({ e, conflicts, onPress }: { e: Occurrence; conflicts?: string[]; onPress?: () => void }) {
  const { members, me } = useData();
  const c = cat(e.category);
  const who = e.memberIds.length ? e.memberIds.map((id) => displayName(members.find((m) => m.id === id), me)).join(', ') : 'Toute la famille';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${e.title}, ${e.allDay ? 'toute la journée' : e.start}`} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, minHeight: 56 }}>
      <View style={{ width: 4, borderRadius: 2, backgroundColor: c.color }} />
      <View style={{ width: 52 }}>
        <Text style={{ color: t.text, fontWeight: '700' }}>{e.allDay ? 'Jour' : e.start}</Text>
        {!e.allDay ? <Text style={{ color: t.muted, fontSize: 12 }}>{e.end}</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: '600', fontSize: 16 }}>{e.title}{e.demo ? '  · démo' : ''}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
          <Ionicons name={c.icon as IconName} size={13} color={c.color} />
          <Text style={{ color: t.muted, fontSize: 13 }}>{c.label} · {who}{e.recurrence !== 'none' ? ' · ↻' : ''}</Text>
        </View>
        {conflicts?.length ? (
          <Text style={{ color: t.danger, fontSize: 12, marginTop: 4, fontWeight: '600' }}>⚠ Conflit avec : {conflicts.join(', ')}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
