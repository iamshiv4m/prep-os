import { BrowserWindow, ipcMain, shell } from "electron";
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
import { TIPS, tipForDay } from "@shared/tips";

export function setupIPC(getMain: () => BrowserWindow | null): void {
  ipcMain.handle("app:getVersion", () => process.env.npm_package_version ?? "0.1.0");
  ipcMain.handle("app:getPlatform", () => process.platform);

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

  ipcMain.handle("chat:listSessions", () => getChatSessions());
  ipcMain.handle("chat:saveSession", (_e, session: ChatSession) => {
    const list = getChatSessions();
    const filtered = list.filter((s) => s.id !== session.id);
    setChatSessions([session, ...filtered].slice(0, 200));
  });
  ipcMain.handle("chat:removeSession", (_e, id: string) => {
    setChatSessions(getChatSessions().filter((s) => s.id !== id));
  });

  ipcMain.handle("notes:list", () => getNotes());
  ipcMain.handle("notes:save", (_e, note: Note) => {
    const list = getNotes();
    const filtered = list.filter((n) => n.id !== note.id);
    setNotes([note, ...filtered].slice(0, 500));
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
