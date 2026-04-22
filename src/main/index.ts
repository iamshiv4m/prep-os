import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  dialog,
  globalShortcut,
  nativeImage,
  screen,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import { captureRegion } from "./capture.js";
import { setupIPC } from "./ipc.js";
import { getSettings } from "./store.js";
import { setOnFocusGuardChanged } from "./focus-guard.js";

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let focusGuardActive = false;
let allowQuit = false;

function createMainWindow(): void {
  const primary = screen.getPrimaryDisplay();
  const { width: workW, height: workH } = primary.workAreaSize;
  const { x: workX, y: workY } = primary.workArea;

  mainWindow = new BrowserWindow({
    x: workX,
    y: workY,
    width: workW,
    height: workH,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#000000",
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 14 },
    vibrancy: process.platform === "darwin" ? "under-window" : undefined,
    visualEffectState: "active",
    frame: process.platform === "darwin",
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      mainWindow?.webContents.send("app:openUrl", url);
    }
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerShortcuts(): void {
  globalShortcut.unregisterAll();
  const { captureShortcut } = getSettings();
  try {
    globalShortcut.register(captureShortcut, async () => {
      const capture = await captureRegion();
      if (capture && mainWindow) {
        mainWindow.webContents.send("capture:ready", capture);
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn("Failed to register capture shortcut", err);
  }
}

function createTray(): void {
  if (tray) return;
  const iconPath = path.join(__dirname, "..", "..", "resources", "tray-icon.png");
  let image: Electron.NativeImage;
  if (fs.existsSync(iconPath)) {
    image = nativeImage.createFromPath(iconPath);
  } else {
    // 1x1 transparent PNG fallback so Tray still initializes (macOS shows text via setTitle)
    image = nativeImage.createEmpty();
  }
  try {
    tray = new Tray(image.resize({ width: 16, height: 16 }));
    if (process.platform === "darwin") tray.setTitle("◆");
    tray.setToolTip("PrepOS");
    const menu = Menu.buildFromTemplate([
      {
        label: "Show PrepOS",
        click: () => {
          if (!mainWindow) createMainWindow();
          else {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: "Capture region → AI",
        accelerator: "Cmd+Shift+A",
        click: async () => {
          const capture = await captureRegion();
          if (capture && mainWindow) {
            mainWindow.webContents.send("capture:ready", capture);
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]);
    tray.setContextMenu(menu);
    tray.on("click", () => {
      if (!mainWindow) createMainWindow();
      else {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn("Failed to create tray", err);
  }
}

async function setupAutoUpdate(): Promise<void> {
  if (!app.isPackaged) return;
  try {
    const { autoUpdater } = await import("electron-updater");
    autoUpdater.autoDownload = true;
    autoUpdater.on("update-downloaded", () => {
      mainWindow?.webContents.send("update:available");
    });
    await autoUpdater.checkForUpdatesAndNotify().catch(() => null);
  } catch (err) {
    console.warn("auto-update setup failed", err);
  }
}

function buildAppMenu(): void {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "close" }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.prepos.app");
  setOnFocusGuardChanged((active) => {
    focusGuardActive = active;
  });
  setupIPC(() => mainWindow);
  buildAppMenu();
  createMainWindow();
  registerShortcuts();
  createTray();
  void setupAutoUpdate();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) mainWindow.maximize();
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on("before-quit", (event) => {
  if (allowQuit || !focusGuardActive) return;
  event.preventDefault();
  const win = mainWindow ?? BrowserWindow.getAllWindows()[0];
  if (win && !win.isVisible()) win.show();
  win?.focus();
  const result = dialog.showMessageBoxSync(win ?? undefined, {
    type: "warning",
    buttons: ["Stay Focused", "End Session & Quit"],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
    title: "Focus mode is active",
    message: "You're in a focus session.",
    detail:
      "Hard focus mode is on. End the session first if you really want to quit PrepOS, or stay focused and get back to work.",
  });
  if (result === 1) {
    allowQuit = true;
    mainWindow?.webContents.send("focus:forceEnd");
    setTimeout(() => app.quit(), 120);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
