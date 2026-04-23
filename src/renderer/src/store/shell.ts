import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ShellStore {
  launchpadOpen: boolean;
  spotlightOpen: boolean;
  modePickerOpen: boolean;
  shortcutsOpen: boolean;
  /** When true, the dock slides out of view unless the cursor is near the bottom edge. */
  dockAutoHide: boolean;
  /** User-defined order for custom (non-built-in) dock apps; plugin ids. */
  customDockOrder: string[];
  /** Incrementing counter — bumping it tells the TasksPopover to open. */
  tasksOpenNonce: number;
  toggleLaunchpad: () => void;
  setLaunchpad: (open: boolean) => void;
  toggleSpotlight: () => void;
  setSpotlight: (open: boolean) => void;
  toggleModePicker: () => void;
  setModePicker: (open: boolean) => void;
  toggleShortcuts: () => void;
  setShortcuts: (open: boolean) => void;
  setDockAutoHide: (v: boolean) => void;
  setCustomDockOrder: (order: string[]) => void;
  openTasks: () => void;
}

export const useShell = create<ShellStore>()(
  persist(
    (set) => ({
      launchpadOpen: false,
      spotlightOpen: false,
      modePickerOpen: false,
      shortcutsOpen: false,
      dockAutoHide: false,
      customDockOrder: [],
      tasksOpenNonce: 0,
      toggleLaunchpad: () =>
        set((s) => ({
          launchpadOpen: !s.launchpadOpen,
          spotlightOpen: false,
          modePickerOpen: false,
        })),
      setLaunchpad: (open) =>
        set((s) => ({
          launchpadOpen: open,
          spotlightOpen: open ? false : s.spotlightOpen,
          modePickerOpen: open ? false : s.modePickerOpen,
        })),
      toggleSpotlight: () =>
        set((s) => ({
          spotlightOpen: !s.spotlightOpen,
          launchpadOpen: false,
          modePickerOpen: false,
        })),
      setSpotlight: (open) =>
        set((s) => ({
          spotlightOpen: open,
          launchpadOpen: open ? false : s.launchpadOpen,
          modePickerOpen: open ? false : s.modePickerOpen,
        })),
      toggleModePicker: () =>
        set((s) => ({
          modePickerOpen: !s.modePickerOpen,
          launchpadOpen: false,
          spotlightOpen: false,
        })),
      setModePicker: (open) =>
        set((s) => ({
          modePickerOpen: open,
          launchpadOpen: open ? false : s.launchpadOpen,
          spotlightOpen: open ? false : s.spotlightOpen,
        })),
      toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),
      setShortcuts: (open) => set({ shortcutsOpen: open }),
      setDockAutoHide: (v) => set({ dockAutoHide: v }),
      setCustomDockOrder: (order) => set({ customDockOrder: order }),
      openTasks: () => set((s) => ({ tasksOpenNonce: s.tasksOpenNonce + 1 })),
    }),
    {
      name: "prepos:shell-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dockAutoHide: state.dockAutoHide,
        customDockOrder: state.customDockOrder,
      }),
    },
  ),
);
