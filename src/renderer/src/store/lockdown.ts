import { create } from "zustand";
import { useNotifications } from "./notifications";

interface LockdownStore {
  active: boolean;
  /** True while enable/disable is in-flight to debounce button spam. */
  pending: boolean;
  /** Timestamp when lockdown was last activated (for session duration). */
  activatedAt: number | null;

  /** Sync state with the main process (called on boot). */
  hydrate: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  setActive: (active: boolean) => void;
}

export const useLockdown = create<LockdownStore>((set, get) => ({
  active: false,
  pending: false,
  activatedAt: null,

  hydrate: async () => {
    try {
      const state = await window.prepOS.lockdown.state();
      set({ active: !!state, activatedAt: state ? Date.now() : null });
    } catch {
      /* ignore */
    }
  },

  enable: async () => {
    if (get().pending || get().active) return;
    set({ pending: true });
    try {
      const ok = await window.prepOS.lockdown.enable();
      if (ok) {
        useNotifications.getState().push({
          kind: "system",
          icon: "🔒",
          title: "Lockdown Mode active",
          body: "App switching is blocked. Unlock from the PrepOS menu when you're done.",
        });
      }
    } finally {
      set({ pending: false });
    }
  },

  disable: async () => {
    if (get().pending || !get().active) return;
    set({ pending: true });
    try {
      const ok = await window.prepOS.lockdown.disable();
      if (ok) {
        useNotifications.getState().push({
          kind: "system",
          icon: "🔓",
          title: "Lockdown Mode lifted",
          body: "You can switch between apps again. Stay disciplined.",
        });
      }
    } finally {
      set({ pending: false });
    }
  },

  setActive: (active) => {
    set((prev) => ({
      active,
      activatedAt: active ? (prev.activatedAt ?? Date.now()) : null,
    }));
  },
}));
