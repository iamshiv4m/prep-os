import { BrowserWindow, app, ipcMain, shell } from "electron";
import type {
  AIChatRequest,
  AIProvider,
  ChatSession,
  FocusSession,
  Note,
  PluginManifest,
} from "@shared/types";
import {
  appendFocusSession,
  clearFocusSessions,
  getApiKey,
  getChatSessions,
  getFocusSessions,
  getNotes,
  getSettings,
  setApiKey,
  setChatSessions,
  setNotes,
  updateSettings,
} from "./store.js";
import { addUserPlugin, listPlugins, removeUserPlugin } from "./plugins.js";
import {
  cancelCapture,
  captureRegion,
  commitCaptureRegion,
  listCaptures,
  removeCapture,
} from "./capture.js";
import { chatWithAI } from "./ai-gateway.js";
import { getFeed, listFeedSources, refreshAllFeeds } from "./feed.js";
import { setFocusGuard } from "./focus-guard.js";
import {
  disableLockdown,
  enableLockdown,
  isLockdownActive,
  onLockdownChanged,
} from "./lockdown.js";
import { TIPS, tipForDay } from "@shared/tips";
import { checkForUpdate } from "./update-checker.js";

export function setupIPC(getMain: () => BrowserWindow | null): void {
  // app.getVersion() reads from the packaged manifest at runtime; the old
  // env-var fallback was always undefined in production builds.
  ipcMain.handle("app:getVersion", () => app.getVersion());
  ipcMain.handle("app:getPlatform", () => process.platform);

  ipcMain.handle("app:quit", () => {
    app.quit();
  });

  ipcMain.handle("app:checkForUpdates", () => checkForUpdate());

  ipcMain.on("window:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.on("window:maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle("settings:get", () => getSettings());
  ipcMain.handle("settings:update", (_e, patch: Record<string, unknown>) =>
    updateSettings(patch as never),
  );
  ipcMain.handle("settings:getApiKey", (_e, provider: AIProvider) => getApiKey(provider));
  ipcMain.handle("settings:setApiKey", (_e, provider: AIProvider, value: string) =>
    setApiKey(provider, value),
  );

  ipcMain.handle("plugins:list", () => listPlugins());
  ipcMain.handle("plugins:add", (_e, manifest: Partial<PluginManifest>) =>
    addUserPlugin(manifest as never),
  );
  ipcMain.handle("plugins:remove", (_e, id: string) => removeUserPlugin(id));

  ipcMain.handle("capture:trigger", async () => {
    const capture = await captureRegion();
    if (capture) {
      const main = getMain();
      main?.webContents.send("capture:ready", capture);
      main?.focus();
    }
    return capture;
  });
  ipcMain.handle("capture:list", () => listCaptures());
  ipcMain.handle("capture:remove", (_e, id: string) => removeCapture(id));
  ipcMain.handle(
    "capture:commitRegion",
    (_e, region: { x: number; y: number; width: number; height: number; displayId: number }) =>
      commitCaptureRegion(region),
  );
  ipcMain.handle("capture:cancelRegion", () => cancelCapture());

  ipcMain.handle("ai:chat", (_e, req: AIChatRequest) => chatWithAI(req));

  // Size caps to stop the electron-store JSON from exploding when users pile
  // up long chats or paste big blobs into notes. Older messages stay on disk
  // only in the most recent 200 sessions × 100 messages window.
  const MAX_MESSAGES_PER_SESSION = 100;
  const MAX_NOTE_BODY_CHARS = 200_000;
  const MAX_MESSAGE_CONTENT_CHARS = 20_000;

  function trimSession(session: ChatSession): ChatSession {
    const messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION).map((m) => ({
      ...m,
      content:
        m.content && m.content.length > MAX_MESSAGE_CONTENT_CHARS
          ? m.content.slice(0, MAX_MESSAGE_CONTENT_CHARS) + "\n…(truncated)"
          : m.content,
    }));
    return { ...session, messages };
  }

  ipcMain.handle("chat:listSessions", () => getChatSessions());
  ipcMain.handle("chat:saveSession", (_e, session: ChatSession) => {
    const list = getChatSessions();
    const filtered = list.filter((s) => s.id !== session.id);
    setChatSessions([trimSession(session), ...filtered].slice(0, 200));
  });
  ipcMain.handle("chat:removeSession", (_e, id: string) => {
    setChatSessions(getChatSessions().filter((s) => s.id !== id));
  });

  ipcMain.handle("notes:list", () => getNotes());
  ipcMain.handle("notes:save", (_e, note: Note) => {
    const list = getNotes();
    const filtered = list.filter((n) => n.id !== note.id);
    const capped: Note = {
      ...note,
      body:
        note.body && note.body.length > MAX_NOTE_BODY_CHARS
          ? note.body.slice(0, MAX_NOTE_BODY_CHARS)
          : note.body,
    };
    setNotes([capped, ...filtered].slice(0, 500));
  });
  ipcMain.handle("notes:remove", (_e, id: string) => {
    setNotes(getNotes().filter((n) => n.id !== id));
  });

  ipcMain.handle("focus:list", () => getFocusSessions());
  ipcMain.handle("focus:append", (_e, session: FocusSession) => {
    appendFocusSession(session);
  });
  ipcMain.handle("focus:clear", () => {
    clearFocusSessions();
  });
  ipcMain.handle("focus:setGuard", (_e, active: boolean) => {
    setFocusGuard(!!active);
  });

  ipcMain.handle("lockdown:enable", () => {
    const win = getMain();
    return enableLockdown(win);
  });
  ipcMain.handle("lockdown:disable", () => {
    return disableLockdown();
  });
  ipcMain.handle("lockdown:state", () => isLockdownActive());

  onLockdownChanged((state) => {
    const win = getMain();
    win?.webContents.send("lockdown:changed", state);
  });

  ipcMain.handle("tips:today", () => tipForDay());
  ipcMain.handle("tips:all", () => TIPS.slice());

  ipcMain.handle("feed:sources", () => listFeedSources());
  ipcMain.handle("feed:list", () => getFeed());
  ipcMain.handle("feed:refresh", () => refreshAllFeeds());

  ipcMain.handle("shell:openExternal", async (_e, url: string) => {
    if (!/^https?:\/\//i.test(url)) return;
    await shell.openExternal(url);
  });
}
