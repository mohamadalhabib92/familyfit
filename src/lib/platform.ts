import Constants from 'expo-constants';
import { Platform, useWindowDimensions } from 'react-native';

/** Vrai sur un binaire react-native-tvos, ou si le build a figé EXPO_TV. */
export function isTv(): boolean {
  const platform = Platform as { isTV?: boolean };
  if (platform.isTV === true) return true;
  const extra = Constants.expoConfig?.extra as { tv?: boolean } | undefined;
  return extra?.tv === true;
}

/** Échelle 10 pieds : le salon lit de plus loin que le téléphone. */
export function useUiScale(): number {
  const { width } = useWindowDimensions();
  if (isTv()) return 1.45;
  if (width >= 900) return 1.05;
  return 1;
}

export function useWideLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= 900;
}
