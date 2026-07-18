/**
 * AppLockBridge.ts
 *
 * Typed TypeScript wrapper around the native AppLockModule.
 * All Android AppLock APIs are accessed through this file.
 */
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

const { AppLockModule } = NativeModules;
const emitter = new NativeEventEmitter(AppLockModule);

export interface InstalledApp {
  packageName: string;
  appName: string;
  isLocked: boolean;
  icon: string; // base64 PNG
}

export interface LockedApp {
  packageName: string;
  appName: string;
  isEnabled: boolean;
  addedAt: number;
}

export interface AppLockSettings {
  unlockMethod: 'PIN' | 'PATTERN' | 'BIOMETRIC';
  gracePeriodMs: number;
  themeId: 'DARK' | 'LIGHT' | 'AMOLED';
  intruderSelfie: boolean;
  serviceEnabled: boolean;
  failedAttempts: number;
  lockoutUntil: number;
}

export type BiometricStatus =
  | 'AVAILABLE'
  | 'NO_HARDWARE'
  | 'UNAVAILABLE'
  | 'NOT_ENROLLED'
  | 'UNKNOWN';

// ─── Permissions ──────────────────────────────────────────────────────────────

export const checkUsagePermission = (): Promise<boolean> =>
  AppLockModule.checkUsagePermission();

export const requestUsagePermission = (): Promise<boolean> =>
  AppLockModule.requestUsagePermission();

export const checkOverlayPermission = (): Promise<boolean> =>
  AppLockModule.checkOverlayPermission();

export const requestOverlayPermission = (): Promise<boolean> =>
  AppLockModule.requestOverlayPermission();

// ─── Service Control ──────────────────────────────────────────────────────────

export const startMonitorService = (): Promise<boolean> =>
  AppLockModule.startMonitorService();

export const stopMonitorService = (): Promise<boolean> =>
  AppLockModule.stopMonitorService();

// ─── Apps ─────────────────────────────────────────────────────────────────────

export const getInstalledApps = (): Promise<InstalledApp[]> =>
  AppLockModule.getInstalledApps();

export const getLockedApps = (): Promise<LockedApp[]> =>
  AppLockModule.getLockedApps();

export const setAppLocked = (
  packageName: string,
  appName: string,
  isLocked: boolean,
): Promise<boolean> => AppLockModule.setAppLocked(packageName, appName, isLocked);

// ─── PIN ──────────────────────────────────────────────────────────────────────

export const setPIN = (pin: string): Promise<boolean> =>
  AppLockModule.setPIN(pin);

export const verifyPIN = (pin: string): Promise<boolean> =>
  AppLockModule.verifyPIN(pin);

export const hasPIN = (): Promise<boolean> =>
  AppLockModule.hasPIN();

// ─── Settings ─────────────────────────────────────────────────────────────────

export const getSettings = (): Promise<AppLockSettings> =>
  AppLockModule.getSettings();

export const saveSettings = (settings: Partial<AppLockSettings>): Promise<boolean> =>
  AppLockModule.saveSettings(settings);

// ─── Biometric ────────────────────────────────────────────────────────────────

export const checkBiometric = (): Promise<BiometricStatus> =>
  AppLockModule.checkBiometric();

// ─── Unlock ───────────────────────────────────────────────────────────────────

export const notifyUnlockSuccess = (): Promise<boolean> =>
  AppLockModule.notifyUnlockSuccess();

// ─── Event Listeners ──────────────────────────────────────────────────────────

export const onAppLocked = (
  callback: (packageName: string) => void,
): EmitterSubscription =>
  emitter.addListener('APP_LOCKED', callback);

export const onUnlockSuccess = (
  callback: () => void,
): EmitterSubscription =>
  emitter.addListener('UNLOCK_SUCCESS', callback);
