import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';
import type { Invitation } from './model';

/** Lien profond d’invitation (web : URL de la PWA ; mobile : schéma familyfit://). */
export const inviteLink = (code: string) => Linking.createURL(`/join/${code}`);

export async function shareInvitation(inv: Invitation, familyName: string) {
  const msg = `Rejoins « ${familyName} » sur FamilyFit.\nCode : ${inv.code} (valable jusqu’au ${inv.expiresAt.split('-').reverse().join('.')})\n${inviteLink(inv.code)}`;
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: { text: string }) => Promise<void> }) : null;
      if (nav?.share) return void (await nav.share({ text: msg }));
      if (nav?.clipboard) return void (await nav.clipboard.writeText(msg));
      return;
    }
    await Share.share({ message: msg });
  } catch { /* annulé */ }
}
