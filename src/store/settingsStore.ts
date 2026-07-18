/**
 * settingsStore.ts — Zustand store for AppLocker settings
 */
import { create } from 'zustand';
import { AppLockSettings, getSettings, saveSettings } from '../services/AppLockBridge';

interface SettingsState {
  settings: AppLockSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<AppLockSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: AppLockSettings = {
  unlockMethod: 'PIN',
  gracePeriodMs: 0,
  themeId: 'DARK',
  intruderSelfie: false,
  serviceEnabled: false,
  failedAttempts: 0,
  lockoutUntil: 0,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const settings = await getSettings();
      set({ settings, isLoaded: true });
    } catch {
      set({ settings: DEFAULT_SETTINGS, isLoaded: true });
    }
  },

  updateSettings: async (patch: Partial<AppLockSettings>) => {
    const updated = { ...get().settings, ...patch };
    set({ settings: updated });
    await saveSettings(patch);
  },
}));
