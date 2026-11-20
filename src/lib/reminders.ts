import { Platform } from 'react-native';
import { shouldRequireNative } from './tvNativeGuard';

/** Rappels LOCAUX (aucun serveur push). Web et Apple TV : message clair, pas de faux rappel. */
export type PermState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

type NotificationsModule = typeof import('expo-notifications');

function notifications(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (!shouldRequireNative('expo-notifications', (Platform as { isTV?: boolean }).isTV === true)) return null;
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

const Notifications = notifications();
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function getPermission(): Promise<PermState> {
  if (Platform.OS === 'web' || !Notifications) return 'unsupported';
  try {
    const s = await Notifications.getPermissionsAsync();
    return s.granted ? 'granted' : s.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function askPermission(): Promise<PermState> {
  if (Platform.OS === 'web' || !Notifications) return 'unsupported';
  try {
    const s = await Notifications.requestPermissionsAsync();
    return s.granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/** Rappel quotidien (rituels). Renvoie l’identifiant natif ou null. */
export async function scheduleDaily(title: string, body: string, hhmm: string): Promise<string | null> {
  if (!Notifications || (await getPermission()) !== 'granted') return null;
  const [hour, minute] = hhmm.split(':').map(Number);
  try {
    return await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute } });
  } catch {
    return null;
  }
}

/** Rappel ponctuel (événement). */
export async function scheduleAt(title: string, body: string, when: Date): Promise<string | null> {
  if (!Notifications || when.getTime() <= Date.now() || (await getPermission()) !== 'granted') return null;
  try {
    return await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when } });
  } catch {
    return null;
  }
}

export async function cancel(id?: string | null) {
  if (!id || Platform.OS === 'web' || !Notifications) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch { /* ignore */ }
}
