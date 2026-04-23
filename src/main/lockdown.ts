import { app, screen } from "electron";
import type { BrowserWindow } from "electron";

type Listener = (active: boolean) => void;

let active = false;
let targetWin: BrowserWindow | null = null;
let blurHandler: (() => void) | null = null;
let savedBounds: Electron.Rectangle | null = null;
let savedAlwaysOnTop = false;
let savedFullscreen = false;
let savedSimpleFullscreen = false;
let refocusTimer: NodeJS.Timeout | null = null;
const listeners = new Set<Listener>();

function isMac(): boolean {
  return process.platform === "darwin";
}

function notify(): void {
  for (const fn of listeners) {
    try {
      fn(active);
    } catch (err) {
      console.error("lockdown listener error", err);
    }
  }
}

/**
 * Aggressively bring a window back to focus.
 * Called when the OS tries to blur us (Cmd+Tab, Mission Control, etc).
 * We can't fully block OS-level shortcuts, but we can snap the window
 * back so switching feels impossible.
 */
function snapBack(win: BrowserWindow): void {
  if (!active || win.isDestroyed()) return;
  if (refocusTimer) return;
  // Debounce to avoid tight refocus loops that fight the OS.
  refocusTimer = setTimeout(() => {
    refocusTimer = null;
    if (!active || win.isDestroyed()) return;
    try {
      if (win.isMinimized()) win.restore();
      win.show();
      win.moveTop();
      win.focus();
      if (isMac()) {
        if (!win.isSimpleFullScreen() && !win.isFullScreen()) win.setSimpleFullScreen(true);
      } else {
        if (!win.isFullScreen()) win.setFullScreen(true);
      }
    } catch (err) {
      console.warn("lockdown snapBack failed", err);
    }
  }, 80);
}

export function isLockdownActive(): boolean {
  return active;
}

export function onLockdownChanged(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function enableLockdown(win: BrowserWindow | null): boolean {
  if (!win || win.isDestroyed()) return false;
  if (active) return true;

  targetWin = win;
  savedBounds = win.getBounds();
  savedAlwaysOnTop = win.isAlwaysOnTop();
  savedFullscreen = win.isFullScreen();
  savedSimpleFullscreen = isMac() ? win.isSimpleFullScreen() : false;

  try {
    const primary = screen.getPrimaryDisplay();
    win.setBounds(primary.bounds);
  } catch (err) {
    console.warn("lockdown: failed to set fullscreen bounds", err);
  }

  if (isMac()) {
    if (!win.isSimpleFullScreen()) win.setSimpleFullScreen(true);
  } else {
    if (!win.isFullScreen()) win.setFullScreen(true);
  }

  try {
    // `screen-saver` level keeps us above most OS chrome/dialogs.
    win.setAlwaysOnTop(true, "screen-saver");
  } catch (err) {
    console.warn("lockdown: setAlwaysOnTop failed", err);
  }

  try {
    win.setKiosk(true);
  } catch (err) {
    // Kiosk mode can fail on some Linux WMs; alwaysOnTop + fullscreen is the floor.
    console.warn("lockdown: setKiosk failed (continuing without it)", err);
  }

  if (isMac()) {
    try {
      app.dock?.hide();
    } catch (err) {
      console.warn("lockdown: dock hide failed", err);
    }
  }

  blurHandler = () => {
    if (!active || !targetWin) return;
    snapBack(targetWin);
  };
  win.on("blur", blurHandler);
  win.on("minimize", blurHandler);

  active = true;
  win.show();
  win.moveTop();
  win.focus();
  notify();
  return true;
}

export function disableLockdown(): boolean {
  if (!active) return false;
  const win = targetWin;
  active = false;

  if (win && !win.isDestroyed()) {
    if (blurHandler) {
      win.removeListener("blur", blurHandler);
      win.removeListener("minimize", blurHandler);
    }
    try {
      win.setKiosk(false);
    } catch (err) {
      console.warn("lockdown: setKiosk(false) failed", err);
    }
    try {
      win.setAlwaysOnTop(savedAlwaysOnTop);
    } catch (err) {
      console.warn("lockdown: restoring alwaysOnTop failed", err);
    }

    if (isMac()) {
      if (!savedSimpleFullscreen) {
        try {
          if (win.isSimpleFullScreen()) win.setSimpleFullScreen(false);
        } catch {
          /* noop */
        }
      }
    } else if (!savedFullscreen) {
      try {
        if (win.isFullScreen()) win.setFullScreen(false);
      } catch {
        /* noop */
      }
    }

    if (savedBounds) {
      try {
        win.setBounds(savedBounds);
      } catch {
        /* noop */
      }
    }

    if (isMac()) {
      try {
        app.dock?.show();
      } catch (err) {
        console.warn("lockdown: dock show failed", err);
      }
    }
  }

  blurHandler = null;
  targetWin = null;
  savedBounds = null;
  if (refocusTimer) {
    clearTimeout(refocusTimer);
    refocusTimer = null;
  }
  notify();
  return true;
}

export function lockdownInterceptsQuit(): boolean {
  return active;
}
