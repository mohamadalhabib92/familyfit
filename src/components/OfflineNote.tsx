import { useEffect, useState } from 'react';
import { useData } from '@/lib/data';
import { translate } from '@/lib/i18n';
import { isOffline } from '@/lib/reachability';
import { TvText } from '@/components/tv/focus';
import { Notice } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export function useOffline(): boolean {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let live = true;
    let unsubscribe = () => {};
    try {
      const mod = require('@react-native-community/netinfo') as {
        default?: { addEventListener: (fn: (state: { isConnected: boolean | null }) => void) => () => void };
        addEventListener?: (fn: (state: { isConnected: boolean | null }) => void) => () => void;
      };
      const NetInfo = mod.default ?? mod;
      if (!NetInfo.addEventListener) return undefined;
      unsubscribe = NetInfo.addEventListener((state) => {
        if (live) setOffline(isOffline(state.isConnected));
      });
    } catch {
      // Module absent : on ne prétend pas que l’appareil est hors ligne.
    }
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);
  return offline;
}

/** Une ligne, pas un bandeau au-dessus du salon : la séance TV garde tout l’écran. */
export function OfflineNote({ tv = false }: { tv?: boolean }) {
  const offline = useOffline();
  const { prefs } = useData();
  if (!offline) return null;
  const text = translate(prefs.locale, 'net.offline');
  if (tv) return <TvText size={22} color={t.text}>{text}</TvText>;
  return <Notice tone="warning" title={text} />;
}
