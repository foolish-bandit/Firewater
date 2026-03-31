/**
 * Storage abstraction layer for Capacitor compatibility.
 *
 * Uses @capacitor/preferences on native platforms for reliable persistence
 * (iOS can purge localStorage). Falls back to localStorage on web.
 *
 * All methods are async to accommodate the Capacitor API.
 */

import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async remove(key: string): Promise<void> {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },

  /**
   * Synchronous localStorage read for initial render (web only).
   * Returns null on native — use async get() in useEffect instead.
   */
  getSync(key: string): string | null {
    if (isNative) return null;
    return localStorage.getItem(key);
  },

  getSyncJSON<T>(key: string): T | null {
    const raw = this.getSync(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
};
