import { View } from 'react-native';
import { TvFocusable, TvScreen, TvText } from '@/components/tv/focus';
import { useData } from '@/lib/data';
import { translate, type CopyKey } from '@/lib/i18n';
import { TV_SAFE } from '@/lib/tvSurface';
import { theme as t } from '@/ui/theme';
import type { Finish } from '@/ui/ThemeProvider';

const FINISHES: { value: Finish; key: CopyKey }[] = [
  { value: 'classic', key: 'settings.classic' },
  { value: 'verre', key: 'settings.verre' },
  { value: 'verre-or', key: 'settings.verreOr' },
];

/** Le fini n’est pas sur l’écran de séance. Il écrit la préférence déjà là. */
export function LivingSettings({ onBack }: { onBack: () => void }) {
  const { prefs, setPrefs } = useData();
  const copy = (key: CopyKey) => translate(prefs.locale, key);
  const choose = (finish: Finish) => setPrefs((prev) => ({ ...prev, finish }));
  return (
    <TvScreen>
      <View style={{ flex: 1, paddingHorizontal: TV_SAFE.horizontal, paddingVertical: TV_SAFE.vertical, justifyContent: 'center', gap: 32 }}>
        <TvText size={56} weight="800">{copy('tv.settings')}</TvText>
        <TvText size={28} color={t.muted}>{copy('settings.finish')}</TvText>
        <View style={{ flexDirection: 'row', gap: 28 }}>
          {FINISHES.map((item, index) => (
            <TvFocusable
              key={item.value}
              preferred={index === 0}
              selected={prefs.finish === item.value}
              label={copy(item.key)}
              onPress={() => choose(item.value)}
              style={{ flex: 1, minHeight: 200 }}
            >
              <TvText size={40} weight="800">{copy(item.key)}</TvText>
            </TvFocusable>
          ))}
        </View>
        <TvFocusable label={copy('moves.back')} onPress={onBack} style={{ alignSelf: 'flex-start', minWidth: 320, minHeight: 88 }}>
          <TvText size={32} weight="800">{copy('moves.back')}</TvText>
        </TvFocusable>
      </View>
    </TvScreen>
  );
}
