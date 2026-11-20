import { useEffect, useRef } from 'react';
import { applyTvMenuPolicy, readTvMenuControl, type TvSurface } from '@/lib/tvMenu';

type MenuEvent = { eventType?: string };
type RNWithTv = {
  useTVEventHandler?: (cb: (event: MenuEvent) => void) => void;
  TVEventControl?: { enableTVMenuKey?: () => void; disableTVMenuKey?: () => void };
  BackHandler?: {
    addEventListener: (eventName: 'hardwareBackPress', handler: () => boolean | null | undefined) => { remove: () => void };
  };
};

function reactNative(): RNWithTv {
  return require('react-native') as RNWithTv;
}

/**
 * Inerte hors Apple TV. Sur tvOS 0.87, Menu pendant une séance appelle
 * `onBack` au lieu de quitter. À la racine, le geste système reste en place.
 */
export function useTvMenu(active: boolean, surface: TvSurface, onBack: () => void) {
  const backRef = useRef(onBack);
  backRef.current = onBack;
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;
  const activeRef = useRef(active);
  activeRef.current = active;
  const rn = reactNative();
  if (typeof rn.useTVEventHandler === 'function') {
    rn.useTVEventHandler((event) => {
      if (!activeRef.current || surfaceRef.current !== 'session') return;
      if (event?.eventType === 'menu' || event?.eventType === 'back') backRef.current();
    });
  }
  useEffect(() => {
    if (!active) return undefined;
    const control = readTvMenuControl(rn);
    applyTvMenuPolicy(surface, control);
    if (surface !== 'session' || !rn.BackHandler?.addEventListener) {
      return () => {
        applyTvMenuPolicy('profiles', control);
      };
    }
    const sub = rn.BackHandler.addEventListener('hardwareBackPress', () => {
      backRef.current();
      return true;
    });
    return () => {
      sub.remove();
      applyTvMenuPolicy('profiles', control);
    };
  }, [active, surface, rn]);
}
