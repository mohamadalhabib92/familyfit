import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import { isTv } from './platform';

export type HealthPermission = 'granted' | 'denied' | 'unavailable';
export type WorkoutWrite = 'written' | 'denied' | 'unavailable' | 'failed';

type NativeHealth = {
  requestPermissions(): Promise<string>;
  writeWorkout(startIso: string, endIso: string, title: string): Promise<string>;
  readSteps(dayIso: string): Promise<number | null>;
};

function native(): NativeHealth | null {
  if (isTv() || Platform.OS === 'web') return null;
  return requireOptionalNativeModule<NativeHealth>('FamilyfitHealth');
}

/**
 * Santé locale, toujours derrière une action de l’utilisateur.
 * Web, Expo Go, Apple TV et refus : l’app continue sans erreur.
 * L’entitlement HealthKit n’est ajouté au binaire que si EXPO_HEALTHKIT=1,
 * après activation de la capacité par le propriétaire.
 */
export async function requestHealthPermissions(): Promise<HealthPermission> {
  const mod = native();
  if (!mod) return 'unavailable';
  try {
    const value = await mod.requestPermissions();
    if (value === 'granted' || value === 'denied') return value;
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function writeHealthWorkout(startIso: string, endIso: string, title: string): Promise<WorkoutWrite> {
  const mod = native();
  if (!mod) return 'unavailable';
  try {
    const value = await mod.writeWorkout(startIso, endIso, title);
    if (value === 'written' || value === 'denied' || value === 'failed') return value;
    return 'unavailable';
  } catch {
    return 'failed';
  }
}

export async function readHealthSteps(dayIso: string): Promise<number | null> {
  const mod = native();
  if (!mod) return null;
  try {
    const value = await mod.readSteps(dayIso);
    return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
  } catch {
    return null;
  }
}
