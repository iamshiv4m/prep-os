import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Three high-level audiences PrepOS optimizes for. The choice is recorded so
 * downstream surfaces (Feed defaults, AI prompt presets, future onboarding
 * hints) can adapt without re-asking. "custom" means the user explicitly opted
 * out of pre-fills.
 */
export type Persona = "student" | "professional" | "custom";

interface OnboardingStore {
  /** True after the user has interacted with (or skipped) the persona picker. */
  completed: boolean;
  persona: Persona | null;
  /** Epoch ms — used purely for analytics-on-device / debugging. */
  completedAt: number | null;
  /**
   * Schema version for the persisted blob. Bump when we change the shape so we
   * can re-trigger the picker for users on stale data.
   */
  version: number;

  setPersona: (persona: Persona) => void;
  reset: () => void;
}

const CURRENT_VERSION = 1;

export const useOnboarding = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      persona: null,
      completedAt: null,
      version: CURRENT_VERSION,

      setPersona: (persona) =>
        set({
          persona,
          completed: true,
          completedAt: Date.now(),
          version: CURRENT_VERSION,
        }),

      reset: () =>
        set({
          completed: false,
          persona: null,
          completedAt: null,
          version: CURRENT_VERSION,
        }),
    }),
    {
      name: "prepos:onboarding",
      storage: createJSONStorage(() => localStorage),
      // If we bump CURRENT_VERSION later, this migration step lets us
      // re-prompt users gracefully without nuking their other settings.
      migrate: (persisted, fromVersion) => {
        const state = persisted as Partial<OnboardingStore> | undefined;
        if (!state || fromVersion < CURRENT_VERSION) {
          return {
            completed: false,
            persona: null,
            completedAt: null,
            version: CURRENT_VERSION,
            setPersona: () => {},
            reset: () => {},
          } as OnboardingStore;
        }
        return state as OnboardingStore;
      },
      version: CURRENT_VERSION,
    },
  ),
);
