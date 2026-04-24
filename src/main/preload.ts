import { contextBridge, ipcRenderer } from "electron";
import type {
  AIChatRequest,
  AIProvider,
  Capture,
  ChatSession,
  ElectronAPI,
  FocusSession,
  Note,
  PluginManifest,
  UpdateAvailablePayload,
} from "@shared/types";

const focusForceEndListeners = new Set<() => void>();
ipcRenderer.on("focus:forceEnd", () => {
  focusForceEndListeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error("focus forceEnd listener error", err);
    }
  });
});

const captureEventListeners = new Set<(c: Capture) => void>();

ipcRenderer.on("capture:ready", (_event, capture: Capture) => {
  captureEventListeners.forEach((fn) => {
    try {
      fn(capture);
    } catch (err) {
      console.error("capture listener error", err);
    }
  });
});

const openUrlListeners = new Set<(url: string) => void>();
ipcRenderer.on("app:openUrl", (_event, url: string) => {
  openUrlListeners.forEach((fn) => {
    try {
      fn(url);
    } catch (err) {
      console.error("openUrl listener error", err);
    }
  });
});

const lockdownListeners = new Set<(active: boolean) => void>();
ipcRenderer.on("lockdown:changed", (_event, active: boolean) => {
  lockdownListeners.forEach((fn) => {
    try {
      fn(active);
    } catch (err) {
      console.error("lockdown listener error", err);
    }
  });
});

const updateAvailableListeners = new Set<(payload: UpdateAvailablePayload) => void>();
ipcRenderer.on("update:available", (_event, payload: UpdateAvailablePayload) => {
  updateAvailableListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error("update:available listener error", err);
    }
  });
});

const api: ElectronAPI = {
  getVersion: () => ipcRenderer.invoke("app:getVersion"),
  getPlatform: () => ipcRenderer.invoke("app:getPlatform"),
  quit: () => ipcRenderer.invoke("app:quit"),
  checkForUpdates: () => ipcRenderer.invoke("app:checkForUpdates"),
  onUpdateAvailable: (cb: (payload: UpdateAvailablePayload) => void) => {
    updateAvailableListeners.add(cb);
    return () => {
      updateAvailableListeners.delete(cb);
    };
  },
  windowControls: {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (patch: Record<string, unknown>) => ipcRenderer.invoke("settings:update", patch),
    getApiKey: (provider: AIProvider) => ipcRenderer.invoke("settings:getApiKey", provider),
    setApiKey: (provider: AIProvider, value: string) =>
      ipcRenderer.invoke("settings:setApiKey", provider, value),
  },
  plugins: {
    list: () => ipcRenderer.invoke("plugins:list"),
    add: (manifest: Partial<PluginManifest>) => ipcRenderer.invoke("plugins:add", manifest),
    remove: (id: string) => ipcRenderer.invoke("plugins:remove", id),
  },
  captures: {
    trigger: () => ipcRenderer.invoke("capture:trigger"),
    list: () => ipcRenderer.invoke("capture:list"),
    remove: (id: string) => ipcRenderer.invoke("capture:remove", id),
    onReady: (cb: (capture: Capture) => void) => {
      captureEventListeners.add(cb);
      return () => captureEventListeners.delete(cb);
    },
  },
  capture: {
    commitRegion: (region: {
      x: number;
      y: number;
      width: number;
      height: number;
      displayId: number;
    }) => ipcRenderer.invoke("capture:commitRegion", region),
    cancelRegion: () => ipcRenderer.invoke("capture:cancelRegion"),
  },
  ai: {
    chat: (req: AIChatRequest) => ipcRenderer.invoke("ai:chat", req),
  },
  chat: {
    listSessions: () => ipcRenderer.invoke("chat:listSessions"),
    saveSession: (session: ChatSession) => ipcRenderer.invoke("chat:saveSession", session),
    removeSession: (id: string) => ipcRenderer.invoke("chat:removeSession", id),
  },
  notes: {
    list: () => ipcRenderer.invoke("notes:list"),
    save: (note: Note) => ipcRenderer.invoke("notes:save", note),
    remove: (id: string) => ipcRenderer.invoke("notes:remove", id),
  },
  focus: {
    list: () => ipcRenderer.invoke("focus:list"),
    append: (session: FocusSession) => ipcRenderer.invoke("focus:append", session),
    clear: () => ipcRenderer.invoke("focus:clear"),
    setGuard: (active: boolean) => ipcRenderer.invoke("focus:setGuard", active),
  },
  tips: {
    today: () => ipcRenderer.invoke("tips:today"),
    all: () => ipcRenderer.invoke("tips:all"),
  },
  feed: {
    sources: () => ipcRenderer.invoke("feed:sources"),
    list: () => ipcRenderer.invoke("feed:list"),
    refresh: () => ipcRenderer.invoke("feed:refresh"),
  },
  contests: {
    list: () => ipcRenderer.invoke("contests:list"),
    refresh: () => ipcRenderer.invoke("contests:refresh"),
  },
  openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  onOpenUrl: (cb: (url: string) => void) => {
    openUrlListeners.add(cb);
    return () => {
      openUrlListeners.delete(cb);
    };
  },
  lockdown: {
    enable: () => ipcRenderer.invoke("lockdown:enable"),
    disable: () => ipcRenderer.invoke("lockdown:disable"),
    state: () => ipcRenderer.invoke("lockdown:state"),
    onChange: (cb: (active: boolean) => void) => {
      lockdownListeners.add(cb);
      return () => {
        lockdownListeners.delete(cb);
      };
    },
  },
};

contextBridge.exposeInMainWorld("prepOSEvents", {
  onFocusForceEnd: (cb: () => void) => {
    focusForceEndListeners.add(cb);
    return () => focusForceEndListeners.delete(cb);
  },
});

contextBridge.exposeInMainWorld("prepOS", api);

declare global {
  interface Window {
    prepOS: ElectronAPI;
    prepOSEvents: {
      onFocusForceEnd: (cb: () => void) => () => boolean;
    };
  }
}
