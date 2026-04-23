import { create } from "zustand";
import { nanoid } from "nanoid";
import type { FocusSession, PluginManifest } from "@shared/types";
import { useNotifications } from "./notifications";

const MIN_SESSION_MS = 10_000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface FocusStore {
  active: boolean;
  startedAt: number | null;
  targetPluginId: string | null;
  targetPluginName: string | null;
  targetPluginIcon: string | null;
  pickerOpen: boolean;
  sessions: FocusSession[];
  loading: boolean;
  hardLock: boolean;

  refresh: () => Promise<void>;
  start: (plugin: PluginManifest) => void;
  end: () => Promise<FocusSession | null>;
  openPicker: () => void;
  closePicker: () => void;
  clearHistory: () => Promise<void>;
  setHardLock: (enabled: boolean) => void;
}

async function syncGuard(active: boolean): Promise<void> {
  try {
    await window.prepOS.focus.setGuard(active);
  } catch {
    /* guard is a soft best-effort signal */
  }
}

export const useFocus = create<FocusStore>((set, get) => ({
  active: false,
  startedAt: null,
  targetPluginId: null,
  targetPluginName: null,
  targetPluginIcon: null,
  pickerOpen: false,
  sessions: [],
  loading: false,
  hardLock: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const sessions = await window.prepOS.focus.list();
      set({ sessions, loading: false });
    } catch (err) {
      console.error("[prepos] focus.refresh failed", err);
      set({ loading: false });
    }
  },

  start: (plugin) => {
    set({
      active: true,
      startedAt: Date.now(),
      targetPluginId: plugin.id,
      targetPluginName: plugin.name,
      targetPluginIcon: plugin.icon,
      pickerOpen: false,
    });
    if (get().hardLock) void syncGuard(true);
  },

  end: async () => {
    const { active, startedAt, targetPluginId, targetPluginName, targetPluginIcon } = get();
    void syncGuard(false);
    if (!active || startedAt == null || !targetPluginId) {
      set({
        active: false,
        startedAt: null,
        targetPluginId: null,
        targetPluginName: null,
        targetPluginIcon: null,
      });
      return null;
    }

    const endedAt = Date.now();
    const durationMs = endedAt - startedAt;

    set({
      active: false,
      startedAt: null,
      targetPluginId: null,
      targetPluginName: null,
      targetPluginIcon: null,
    });

    if (durationMs < MIN_SESSION_MS) return null;

    const session: FocusSession = {
      id: nanoid(10),
      pluginId: targetPluginId,
      pluginName: targetPluginName ?? targetPluginId,
      pluginIcon: targetPluginIcon ?? undefined,
      startedAt,
      endedAt,
      durationMs,
    };
    await window.prepOS.focus.append(session);
    await get().refresh();

    useNotifications.getState().push({
      kind: "focus",
      icon: session.pluginIcon ?? "🎯",
      title: `Focused on ${session.pluginName}`,
      body: `Session lasted ${formatDuration(durationMs)}. Keep the streak going!`,
    });

    return session;
  },

  openPicker: () => set({ pickerOpen: true }),
  closePicker: () => set({ pickerOpen: false }),

  clearHistory: async () => {
    await window.prepOS.focus.clear();
    await get().refresh();
  },

  setHardLock: (enabled) => {
    set({ hardLock: enabled });
    if (get().active) void syncGuard(enabled);
    else void syncGuard(false);
  },
}));

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todayMs(sessions: FocusSession[]): number {
  const start = startOfToday();
  return sessions.filter((s) => s.endedAt >= start).reduce((sum, s) => sum + s.durationMs, 0);
}

export function yesterdayMs(sessions: FocusSession[]): number {
  const startToday = startOfToday();
  const startYesterday = startToday - DAY_MS;
  return sessions
    .filter((s) => s.endedAt >= startYesterday && s.endedAt < startToday)
    .reduce((sum, s) => sum + s.durationMs, 0);
}

export function last7DaysMs(sessions: FocusSession[]): number {
  const cutoff = startOfToday() - 6 * DAY_MS;
  return sessions.filter((s) => s.endedAt >= cutoff).reduce((sum, s) => sum + s.durationMs, 0);
}

export function thisWeekMs(sessions: FocusSession[]): number {
  return last7DaysMs(sessions);
}

export function perPluginMs(
  sessions: FocusSession[],
): Array<{ pluginId: string; pluginName: string; pluginIcon?: string; durationMs: number }> {
  const bucket = new Map<
    string,
    { pluginId: string; pluginName: string; pluginIcon?: string; durationMs: number }
  >();
  for (const s of sessions) {
    const prev = bucket.get(s.pluginId);
    if (prev) {
      prev.durationMs += s.durationMs;
    } else {
      bucket.set(s.pluginId, {
        pluginId: s.pluginId,
        pluginName: s.pluginName,
        pluginIcon: s.pluginIcon,
        durationMs: s.durationMs,
      });
    }
  }
  return [...bucket.values()].sort((a, b) => b.durationMs - a.durationMs);
}

export function recentSessions(sessions: FocusSession[], n: number): FocusSession[] {
  return [...sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, n);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return "0s";
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

export function formatTimer(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
