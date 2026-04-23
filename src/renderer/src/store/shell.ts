import { create } from "zustand";

interface ShellStore {
  launchpadOpen: boolean;
  spotlightOpen: boolean;
  modePickerOpen: boolean;
  shortcutsOpen: boolean;
  toggleLaunchpad: () => void;
  setLaunchpad: (open: boolean) => void;
  toggleSpotlight: () => void;
  setSpotlight: (open: boolean) => void;
  toggleModePicker: () => void;
  setModePicker: (open: boolean) => void;
  toggleShortcuts: () => void;
  setShortcuts: (open: boolean) => void;
}

export const useShell = create<ShellStore>((set) => ({
  launchpadOpen: false,
  spotlightOpen: false,
  modePickerOpen: false,
  shortcutsOpen: false,
  toggleLaunchpad: () =>
    set((s) => ({ launchpadOpen: !s.launchpadOpen, spotlightOpen: false, modePickerOpen: false })),
  setLaunchpad: (open) =>
    set((s) => ({
      launchpadOpen: open,
      spotlightOpen: open ? false : s.spotlightOpen,
      modePickerOpen: open ? false : s.modePickerOpen,
    })),
  toggleSpotlight: () =>
    set((s) => ({ spotlightOpen: !s.spotlightOpen, launchpadOpen: false, modePickerOpen: false })),
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
}));
