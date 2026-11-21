import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

let reduceMotion = false;
const listeners = new Set<(v: boolean) => void>();
let subscribed = false;

function ensure() {
  if (subscribed) return;
  subscribed = true;
  const apply = (v: boolean) => {
    reduceMotion = v;
    listeners.forEach((fn) => fn(v));
  };
  AccessibilityInfo.isReduceMotionEnabled?.().then(apply).catch(() => undefined);
  AccessibilityInfo.addEventListener?.('reduceMotionChanged', apply);
}

/** Même source que le kit : les avatars et les pressions s’arrêtent si l’animation est réduite. */
export function useReduceMotion(): boolean {
  const [v, setV] = useState(reduceMotion);
  useEffect(() => {
    ensure();
    listeners.add(setV);
    setV(reduceMotion);
    return () => { listeners.delete(setV); };
  }, []);
  return v;
}
