import {
  BrowserWindow,
  app,
  desktopCapturer,
  dialog,
  nativeImage,
  screen,
  shell,
  systemPreferences,
} from "electron";
import { nanoid } from "nanoid";
import path from "node:path";
import fs from "node:fs/promises";
import type { Capture } from "@shared/types";
import { getCaptures, setCaptures } from "./store.js";

interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId: number;
}

let overlayWindow: BrowserWindow | null = null;
let pendingResolver: ((capture: Capture | null) => void) | null = null;
let permissionDialogOpen = false;

function resolvePending(result: Capture | null): void {
  if (pendingResolver) {
    pendingResolver(result);
    pendingResolver = null;
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
  overlayWindow = null;
}

type ScreenStatus = "granted" | "denied" | "not-determined" | "restricted" | "unknown";

function screenPermissionStatus(): ScreenStatus {
  if (process.platform !== "darwin") return "granted";
  try {
    return systemPreferences.getMediaAccessStatus("screen") as ScreenStatus;
  } catch {
    return "unknown";
  }
}

function isHardDenied(): boolean {
  // On first launch the OS reports "not-determined"; we let the capture attempt
  // proceed so macOS triggers its native prompt. Only "denied" / "restricted"
  // mean the user has actively blocked us and we need to guide them.
  const status = screenPermissionStatus();
  return status === "denied" || status === "restricted";
}

async function promptForScreenPermission(): Promise<void> {
  if (process.platform !== "darwin") return;
  if (permissionDialogOpen) return;
  permissionDialogOpen = true;
  try {
    const { response } = await dialog.showMessageBox({
      type: "warning",
      title: "Screen Recording permission required",
      message: "PrepOS needs Screen Recording access to capture a region.",
      detail:
        "macOS blocks screen capture until you grant permission. " +
        "Open System Settings → Privacy & Security → Screen Recording " +
        "and enable PrepOS (or Electron when running in dev). " +
        "You may need to quit and relaunch the app after granting access.",
      buttons: ["Open System Settings", "Later"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) {
      await shell.openExternal(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
      );
    }
  } finally {
    permissionDialogOpen = false;
  }
}

async function showCaptureFailureDialog(detail: string): Promise<void> {
  if (permissionDialogOpen) return;
  permissionDialogOpen = true;
  try {
    await dialog.showMessageBox({
      type: "error",
      title: "Capture failed",
      message: "PrepOS could not capture the screen.",
      detail,
      buttons: ["OK"],
      defaultId: 0,
    });
  } finally {
    permissionDialogOpen = false;
  }
}

async function capturesDir(): Promise<string> {
  const dir = path.join(app.getPath("userData"), "captures");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function listCaptures(): Promise<Capture[]> {
  return getCaptures().sort((a, b) => b.createdAt - a.createdAt);
}

export async function removeCapture(id: string): Promise<void> {
  const list = getCaptures();
  const target = list.find((c) => c.id === id);
  if (target) {
    try {
      await fs.unlink(target.path);
    } catch {
      // ignore missing file
    }
  }
  setCaptures(list.filter((c) => c.id !== id));
}

async function captureFullDisplays(): Promise<
  Array<{ displayId: number; dataUrl: string; bounds: Electron.Rectangle; scaleFactor: number }>
> {
  const displays = screen.getAllDisplays();
  // Cap enumeration thumbnails so multi-4K setups don't choke ffmpeg.
  const ENUM_MAX_WIDTH = 2560;
  const maxPhysicalWidth = Math.max(...displays.map((d) => d.size.width * d.scaleFactor));
  const scale = Math.min(1, ENUM_MAX_WIDTH / Math.max(1, maxPhysicalWidth));
  const thumbWidth = Math.round(maxPhysicalWidth * scale);
  const thumbHeight = Math.round(
    Math.max(...displays.map((d) => d.size.height * d.scaleFactor)) * scale,
  );

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: thumbWidth, height: thumbHeight },
  });

  return displays.map((display, idx) => {
    const source =
      sources.find((s) => String(s.display_id) === String(display.id)) ??
      sources[idx] ??
      sources[0];
    return {
      displayId: display.id,
      dataUrl: source ? source.thumbnail.toDataURL() : "",
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
    };
  });
}

function buildOverlayHtml(
  displays: Array<{
    displayId: number;
    dataUrl: string;
    bounds: Electron.Rectangle;
    scaleFactor: number;
  }>,
  primary: { x: number; y: number },
): string {
  const payload = JSON.stringify({ displays, primary });
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Capture</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; color: white; }
  canvas { position: absolute; top: 0; left: 0; cursor: crosshair; }
  .hint { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); padding: 10px 18px; background: rgba(0,0,0,0.55); backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.15); border-radius: 999px; font-size: 13px; letter-spacing: 0.02em; z-index: 10; }
  kbd { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-family: inherit; }
  .dim { color: rgba(255,255,255,0.6); }
  .box { position: absolute; border: 1.5px solid #0a84ff; background: rgba(10,132,255,0.1); pointer-events: none; }
  .dims { position: absolute; padding: 3px 7px; font-size: 11px; background: rgba(10,132,255,0.92); color: white; border-radius: 4px; font-variant-numeric: tabular-nums; pointer-events: none; }
</style>
</head>
<body>
<div class="hint">Drag to capture a region · <kbd>Esc</kbd> to cancel</div>
<canvas id="stage"></canvas>
<div id="box" class="box" style="display:none"></div>
<div id="dims" class="dims" style="display:none"></div>
<script>
  const { displays, primary } = ${payload};
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const box = document.getElementById('box');
  const dims = document.getElementById('dims');

  const totalW = window.innerWidth;
  const totalH = window.innerHeight;
  canvas.width = totalW * (window.devicePixelRatio || 1);
  canvas.height = totalH * (window.devicePixelRatio || 1);
  canvas.style.width = totalW + 'px';
  canvas.style.height = totalH + 'px';
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  const imgs = [];
  let loaded = 0;
  displays.forEach((d, i) => {
    const img = new Image();
    img.onload = () => { loaded++; if (loaded === displays.length) draw(); };
    img.src = d.dataUrl;
    imgs[i] = img;
  });

  function draw() {
    ctx.clearRect(0, 0, totalW, totalH);
    displays.forEach((d, i) => {
      ctx.drawImage(
        imgs[i],
        d.bounds.x - primary.x,
        d.bounds.y - primary.y,
        d.bounds.width,
        d.bounds.height
      );
    });
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, totalW, totalH);
  }

  let start = null;
  canvas.addEventListener('mousedown', (e) => {
    start = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!start) return;
    const x = Math.min(start.x, e.clientX);
    const y = Math.min(start.y, e.clientY);
    const w = Math.abs(e.clientX - start.x);
    const h = Math.abs(e.clientY - start.y);
    box.style.display = 'block';
    box.style.left = x + 'px';
    box.style.top = y + 'px';
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    dims.style.display = 'block';
    dims.style.left = (x + w + 8) + 'px';
    dims.style.top = (y + h + 8) + 'px';
    dims.textContent = Math.round(w) + ' × ' + Math.round(h);
  });
  canvas.addEventListener('mouseup', (e) => {
    if (!start) return;
    const x = Math.min(start.x, e.clientX);
    const y = Math.min(start.y, e.clientY);
    const w = Math.abs(e.clientX - start.x);
    const h = Math.abs(e.clientY - start.y);
    start = null;
    if (w < 5 || h < 5) {
      window.prepOS.capture.cancelRegion();
      return;
    }
    window.prepOS.capture.commitRegion({
      x: x + primary.x,
      y: y + primary.y,
      width: Math.round(w),
      height: Math.round(h),
      displayId: displays[0].displayId,
    });
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.prepOS.capture.cancelRegion();
  });
</script>
</body>
</html>`;
}

export async function captureRegion(): Promise<Capture | null> {
  if (overlayWindow) return null;

  if (isHardDenied()) {
    await promptForScreenPermission();
    return null;
  }

  let displays;
  try {
    displays = await captureFullDisplays();
  } catch (err) {
    console.error("captureFullDisplays failed", err);
    if (isHardDenied() || screenPermissionStatus() !== "granted") {
      await promptForScreenPermission();
    } else {
      await showCaptureFailureDialog(
        `Failed to enumerate screens: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return null;
  }

  if (displays.every((d) => !d.dataUrl)) {
    if (screenPermissionStatus() !== "granted") {
      await promptForScreenPermission();
    } else {
      await showCaptureFailureDialog(
        "No screen sources returned. Try relaunching PrepOS or re-granting Screen Recording permission.",
      );
    }
    return null;
  }

  const cursor = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursor);

  overlayWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    fullscreenable: false,
    focusable: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "..", "preload", "preload.js"),
    },
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const html = buildOverlayHtml(displays, { x: targetDisplay.bounds.x, y: targetDisplay.bounds.y });
  await overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  overlayWindow.show();
  overlayWindow.focus();

  overlayWindow.on("closed", () => {
    overlayWindow = null;
    if (pendingResolver) {
      pendingResolver(null);
      pendingResolver = null;
    }
  });

  return new Promise<Capture | null>((resolve) => {
    pendingResolver = resolve;
  });
}

export async function commitCaptureRegion(region: CaptureRegion): Promise<Capture | null> {
  try {
    if (isHardDenied()) {
      resolvePending(null);
      await promptForScreenPermission();
      return null;
    }
    const display =
      screen.getAllDisplays().find((d) => d.id === region.displayId) ?? screen.getPrimaryDisplay();
    const scale = display.scaleFactor;
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: Math.round(display.size.width * scale),
        height: Math.round(display.size.height * scale),
      },
    });
    const source = sources.find((s) => String(s.display_id) === String(display.id)) ?? sources[0];
    if (!source) {
      resolvePending(null);
      await showCaptureFailureDialog(
        "No screen source matched. Please re-try after granting Screen Recording permission.",
      );
      return null;
    }

    const full = source.thumbnail;
    const localX = Math.round((region.x - display.bounds.x) * scale);
    const localY = Math.round((region.y - display.bounds.y) * scale);
    const localW = Math.round(region.width * scale);
    const localH = Math.round(region.height * scale);
    const cropped = full.crop({ x: localX, y: localY, width: localW, height: localH });
    const buffer = cropped.toPNG();

    const id = nanoid(10);
    const dir = await capturesDir();
    const filePath = path.join(dir, `${Date.now()}-${id}.png`);
    await fs.writeFile(filePath, buffer);

    const capture: Capture = {
      id,
      path: filePath,
      dataUrl: nativeImage.createFromBuffer(buffer).toDataURL(),
      createdAt: Date.now(),
      width: localW,
      height: localH,
    };

    const list = getCaptures();
    setCaptures([capture, ...list].slice(0, 200));

    resolvePending(capture);
    return capture;
  } catch (err) {
    console.error("commitCaptureRegion failed", err);
    resolvePending(null);
    if (screenPermissionStatus() !== "granted") {
      await promptForScreenPermission();
    } else {
      await showCaptureFailureDialog(
        `Could not crop the captured region: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return null;
  }
}

export function cancelCapture(): void {
  resolvePending(null);
}
