import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FocusSession } from "@shared/types";

export interface StudyMode {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  /** Tailwind-compatible hex used for the chip border, progress ring and accents. */
  accent: string;
  /** Plugin IDs that should launch (or be suggested) when the mode is activated. */
  defaultApps: string[];
  /** When set, switching into this mode auto-starts a focus session on the first default app. */
  focus: {
    enabled: boolean;
    hardLock: boolean;
  };
  /** Suggested daily investment in minutes. */
  dailyGoalMins?: number;
}

export const STUDY_MODES: StudyMode[] = [
  {
    id: "placement",
    name: "Placement Prep",
    icon: "🎯",
    tagline: "Lock in for interviews",
    description: "LeetCode + Notes + AI Chat. Focused sprint for top companies.",
    accent: "#ef4444",
    defaultApps: ["leetcode", "notes", "ai-chat"],
    focus: { enabled: true, hardLock: false },
    dailyGoalMins: 120,
  },
  {
    id: "dsa",
    name: "DSA Grind",
    icon: "🧠",
    tagline: "Problems only — no scroll",
    description: "LeetCode + HackerRank + Notes. Hard-lock keeps you on one app.",
    accent: "#8b5cf6",
    defaultApps: ["leetcode", "hackerrank", "notes"],
    focus: { enabled: true, hardLock: true },
    dailyGoalMins: 90,
  },
  {
    id: "frontend",
    name: "Frontend Prep",
    icon: "🎨",
    tagline: "JS, React, system design",
    description: "DevTools Tech + Playground + Feed. Build + learn + skim articles.",
    accent: "#06b6d4",
    defaultApps: ["devtools-tech", "playground", "feed"],
    focus: { enabled: true, hardLock: false },
    dailyGoalMins: 60,
  },
  {
    id: "project",
    name: "Project Work",
    icon: "💻",
    tagline: "Ship the portfolio stuff",
    description: "GitHub + Excalidraw + AI Chat + Playground. Build in the open.",
    accent: "#10b981",
    defaultApps: ["github", "excalidraw", "ai-chat", "playground"],
    focus: { enabled: true, hardLock: false },
    dailyGoalMins: 90,
  },
  {
    id: "study",
    name: "Study / Learn",
    icon: "📚",
    tagline: "Absorb, don't grind",
    description: "Feed + YouTube + Notes + AI. Relaxed learning time.",
    accent: "#3b82f6",
    defaultApps: ["feed", "youtube-prep", "notes", "ai-chat"],
    focus: { enabled: false, hardLock: false },
    dailyGoalMins: 45,
  },
  {
    id: "revision",
    name: "Revision",
    icon: "📝",
    tagline: "Before the exam / interview",
    description: "Notes + Playground. Hard-locked so you actually revise.",
    accent: "#ec4899",
    defaultApps: ["notes", "playground"],
    focus: { enabled: true, hardLock: true },
    dailyGoalMins: 30,
  },
  {
    id: "chill",
    name: "Chill",
    icon: "🌙",
    tagline: "Brain off — just the feed",
    description: "Dev News only. Take a break without abandoning the app.",
    accent: "#64748b",
    defaultApps: ["feed"],
    focus: { enabled: false, hardLock: false },
  },
];

interface ModesStore {
  modes: StudyMode[];
  activeId: string | null;
  activatedAt: number | null;
  setActive: (id: string | null) => void;
}

export const useModes = create<ModesStore>()(
  persist(
    (set) => ({
      modes: STUDY_MODES,
      activeId: null,
      activatedAt: null,
      setActive: (id) =>
        set({
          activeId: id,
          activatedAt: id ? Date.now() : null,
        }),
    }),
    {
      name: "prepos:modes",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeId: state.activeId, activatedAt: state.activatedAt }),
    },
  ),
);

export function getModeById(id: string | null | undefined): StudyMode | undefined {
  if (!id) return undefined;
  return STUDY_MODES.find((m) => m.id === id);
}

/**
 * Compute today's invested minutes toward a mode by counting focus sessions
 * on any of the mode's default apps that happened since midnight.
 */
export function modeProgressToday(mode: StudyMode, sessions: FocusSession[]): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const appSet = new Set(mode.defaultApps);
  const ms = sessions
    .filter((s) => s.endedAt >= startMs && appSet.has(s.pluginId))
    .reduce((sum, s) => sum + s.durationMs, 0);
  return Math.round(ms / 60_000);
}
