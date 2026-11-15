import { requireOptionalNativeModule } from 'expo-modules-core';

export type HealthPermission = 'granted' | 'denied' | 'unavailable';
export type WorkoutWrite = 'written' | 'denied' | 'unavailable' | 'failed';

type NativeHealth = {
  requestPermissions(): Promise<HealthPermission>;
  writeWorkout(startIso: string, endIso: string, title: string): Promise<WorkoutWrite>;
  readSteps(dayIso: string): Promise<number | null>;
};

const native = requireOptionalNativeModule<NativeHealth>('FamilyfitHealth');

export function healthNativeAvailable(): boolean {
  return native != null;
}

export async function requestHealthPermissions(): Promise<HealthPermission> {
  if (!native) return 'unavailable';
  try {
    const value = await native.requestPermissions();
    if (value === 'granted' || value === 'denied' || value === 'unavailable') return value;
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function writeHealthWorkout(startIso: string, endIso: string, title: string): Promise<WorkoutWrite> {
  if (!native) return 'unavailable';
  try {
    return await native.writeWorkout(startIso, endIso, title);
  } catch {
    return 'failed';
  }
}

export async function readHealthSteps(dayIso: string): Promise<number | null> {
  if (!native) return null;
  try {
    const value = await native.readSteps(dayIso);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
