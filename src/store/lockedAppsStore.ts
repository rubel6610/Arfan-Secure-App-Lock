/**
 * lockedAppsStore.ts — Zustand store for locked apps list
 */
import { create } from 'zustand';
import {
  InstalledApp,
  LockedApp,
  getInstalledApps,
  getLockedApps,
  setAppLocked,
} from '../services/AppLockBridge';

interface LockedAppsState {
  installedApps: InstalledApp[];
  lockedApps: LockedApp[];
  isLoading: boolean;
  searchQuery: string;

  loadInstalledApps: () => Promise<void>;
  loadLockedApps: () => Promise<void>;
  toggleLock: (packageName: string, appName: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  filteredApps: () => InstalledApp[];
}

export const useLockedAppsStore = create<LockedAppsState>((set, get) => ({
  installedApps: [],
  lockedApps: [],
  isLoading: false,
  searchQuery: '',

  loadInstalledApps: async () => {
    set({ isLoading: true });
    try {
      const apps = await getInstalledApps();
      set({ installedApps: apps, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadLockedApps: async () => {
    try {
      const apps = await getLockedApps();
      set({ lockedApps: apps });
    } catch {}
  },

  toggleLock: async (packageName: string, appName: string) => {
    const { installedApps } = get();
    const app = installedApps.find(a => a.packageName === packageName);
    if (!app) return;

    const newLocked = !app.isLocked;

    // Optimistic update
    set({
      installedApps: installedApps.map(a =>
        a.packageName === packageName ? { ...a, isLocked: newLocked } : a,
      ),
    });

    try {
      await setAppLocked(packageName, appName, newLocked);
    } catch {
      // Revert on failure
      set({
        installedApps: get().installedApps.map(a =>
          a.packageName === packageName ? { ...a, isLocked: !newLocked } : a,
        ),
      });
    }
  },

  setSearchQuery: (q: string) => set({ searchQuery: q }),

  filteredApps: () => {
    const { installedApps, searchQuery } = get();
    if (!searchQuery) return installedApps;
    const q = searchQuery.toLowerCase();
    return installedApps.filter(a => a.appName.toLowerCase().includes(q));
  },
}));
