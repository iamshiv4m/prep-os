import { create } from "zustand";
import { nanoid } from "nanoid";
import type { PluginManifest } from "@shared/types";

export interface WindowState {
  id: string;
  pluginId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  type: "native" | "webview";
  entry: string;
  /** Free-form state the app component can persist (session id, url, etc.) */
  appState?: Record<string, unknown>;
  /** Original position before maximizing. */
  restore?: { x: number; y: number; width: number; height: number };
}

export type SnapZone =
  | "left"
  | "right"
  | "top"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

interface WindowStore {
  windows: WindowState[];
  focusedId: string | null;
  topZ: number;

  openApp: (plugin: PluginManifest, appState?: Record<string, unknown>) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string, viewport: { width: number; height: number }) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number) => void;
  /** Snap a window to a zone of the viewport (half/quarter/top). */
  snapWindow: (id: string, zone: SnapZone, viewport: { width: number; height: number }) => void;
  /** Center a window at its default size (restore from snap/maximize). */
  centerWindow: (id: string, viewport: { width: number; height: number }) => void;
  updateAppState: (id: string, patch: Record<string, unknown>) => void;
  setWindowTitle: (id: string, title: string) => void;
}

let sequence = 10;

export const useWindows = create<WindowStore>((set, get) => ({
  windows: [],
  focusedId: null,
  topZ: 10,

  openApp: (plugin, appState) => {
    const id = nanoid(8);
    sequence += 1;
    const defaults = plugin.window?.defaultSize ?? { w: 960, h: 640 };
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    // Open windows generously: ensure they fill most of the desktop so PrepOS
    // feels like a real OS. Bigger of plugin defaults and ~90% of viewport,
    // capped at viewport minus safe margins (for menubar / dock).
    const targetW = Math.max(defaults.w, Math.round(viewportW * 0.9));
    const targetH = Math.max(defaults.h, Math.round(viewportH * 0.9));
    const width = Math.min(targetW, viewportW - 40);
    const height = Math.min(targetH, viewportH - 110);
    const existing = get().windows.length;
    const offset = (existing % 6) * 28;
    const x = Math.max(20, Math.round((viewportW - width) / 2) + offset - 40);
    const y = Math.max(8, Math.round((viewportH - height) / 2) + offset - 60);

    const win: WindowState = {
      id,
      pluginId: plugin.id,
      title: plugin.name,
      icon: plugin.icon,
      x,
      y,
      width,
      height,
      zIndex: sequence,
      minimized: false,
      maximized: false,
      type: plugin.type,
      entry: plugin.entry,
      appState,
    };
    set((state) => ({
      windows: [...state.windows, win],
      focusedId: id,
      topZ: sequence,
    }));
    return id;
  },

  closeWindow: (id) => {
    set((state) => {
      const windows = state.windows.filter((w) => w.id !== id);
      const focusedId =
        state.focusedId === id
          ? (windows.reduce<WindowState | null>(
              (acc, w) => (!acc || w.zIndex > acc.zIndex ? w : acc),
              null,
            )?.id ?? null)
          : state.focusedId;
      return { windows, focusedId };
    });
  },

  focusWindow: (id) => {
    sequence += 1;
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, zIndex: sequence, minimized: false } : w,
      ),
      focusedId: id,
      topZ: sequence,
    }));
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      focusedId: state.focusedId === id ? null : state.focusedId,
    }));
  },

  restoreWindow: (id) => {
    sequence += 1;
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, minimized: false, zIndex: sequence } : w,
      ),
      focusedId: id,
      topZ: sequence,
    }));
  },

  toggleMaximize: (id, viewport) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.restore) {
          return { ...w, ...w.restore, maximized: false, restore: undefined };
        }
        return {
          ...w,
          restore: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height - 28 - 88,
          maximized: true,
        };
      }),
    }));
  },

  moveWindow: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  },

  resizeWindow: (id, width, height) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, width: Math.max(320, width), height: Math.max(240, height) } : w,
      ),
    }));
  },

  snapWindow: (id, zone, viewport) => {
    // Viewport here is the inner workspace (below menubar, above dock).
    // Menubar is 28px, dock area ~88px, consistent with toggleMaximize above.
    const MENUBAR = 28;
    const DOCK_ROOM = 88;
    const usableW = viewport.width;
    const usableH = viewport.height - MENUBAR - DOCK_ROOM;
    const halfW = Math.round(usableW / 2);
    const halfH = Math.round(usableH / 2);

    let bounds: { x: number; y: number; width: number; height: number } = {
      x: 0,
      y: 0,
      width: usableW,
      height: usableH,
    };
    switch (zone) {
      case "left":
        bounds = { x: 0, y: 0, width: halfW, height: usableH };
        break;
      case "right":
        bounds = { x: halfW, y: 0, width: usableW - halfW, height: usableH };
        break;
      case "top":
        bounds = { x: 0, y: 0, width: usableW, height: usableH };
        break;
      case "top-left":
        bounds = { x: 0, y: 0, width: halfW, height: halfH };
        break;
      case "top-right":
        bounds = { x: halfW, y: 0, width: usableW - halfW, height: halfH };
        break;
      case "bottom-left":
        bounds = { x: 0, y: halfH, width: halfW, height: usableH - halfH };
        break;
      case "bottom-right":
        bounds = { x: halfW, y: halfH, width: usableW - halfW, height: usableH - halfH };
        break;
    }

    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        // Preserve original restore bounds on first snap so the user can get back.
        const restore =
          w.restore ??
          (w.maximized ? w.restore : { x: w.x, y: w.y, width: w.width, height: w.height });
        return {
          ...w,
          ...bounds,
          maximized: false,
          restore,
        };
      }),
    }));
  },

  centerWindow: (id, viewport) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.restore) {
          return { ...w, ...w.restore, restore: undefined, maximized: false };
        }
        const width = Math.min(w.width, Math.round(viewport.width * 0.85));
        const height = Math.min(w.height, Math.round(viewport.height * 0.8));
        const x = Math.max(20, Math.round((viewport.width - width) / 2));
        const y = Math.max(40, Math.round((viewport.height - height) / 2 - 20));
        return { ...w, x, y, width, height, maximized: false };
      }),
    }));
  },

  updateAppState: (id, patch) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, appState: { ...w.appState, ...patch } } : w,
      ),
    }));
  },

  setWindowTitle: (id, title) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, title } : w)),
    }));
  },
}));
