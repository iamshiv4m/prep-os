import { create } from "zustand";

interface ShellStore {
  launchpadOpen: boolean;
  spotlightOpen: boolean;
  toggleLaunchpad: () => void;
  setLaunchpad: (open: boolean) => void;
  toggleSpotlight: () => void;
  setSpotlight: (open: boolean) => void;
}

export const useShell = create<ShellStore>((set) => ({
  launchpadOpen: false,
  spotlightOpen: false,
  toggleLaunchpad: () => set((s) => ({ launchpadOpen: !s.launchpadOpen, spotlightOpen: false })),
  setLaunchpad: (open) =>
    set((s) => ({ launchpadOpen: open, spotlightOpen: open ? false : s.spotlightOpen })),
  toggleSpotlight: () => set((s) => ({ spotlightOpen: !s.spotlightOpen, launchpadOpen: false })),
  setSpotlight: (open) =>
    set((s) => ({ spotlightOpen: open, launchpadOpen: open ? false : s.launchpadOpen })),
}));
