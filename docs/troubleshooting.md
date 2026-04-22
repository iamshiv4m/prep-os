# Troubleshooting

Known issues, warnings, and fixes.

## Build & dev server

### `ERR_REQUIRE_ESM` at Electron startup

```
Error [ERR_REQUIRE_ESM]: require() of ES Module ... from out/main/index.js not supported.
```

Cause: a pure-ESM package was added to the main process. Electron's main is bundled as CJS, so `require`-ing an ESM-only package fails at runtime (TypeScript won't catch this).

Known offenders we've hit:

- `nanoid@5+` → pin to `^3.3.8`
- `electron-store@10+` → pin to `^8.2.0`
- `chalk@5+` → pin to `^4.x`

Fix: either pin to the last CJS version of the package, or use a dynamic import inside an async function:

```ts
const { autoUpdater } = await import("electron-updater");
```

The renderer doesn't have this problem — it's built as ESM by Vite.

### `MODULE_TYPELESS_PACKAGE_JSON` warning

```
Warning: Module type of file:///.../postcss.config.js is not specified
```

Benign. PostCSS reads its config and Node emits a warning about the missing `"type"` field. Ignore — or add `"type": "commonjs"` to `postcss.config.js` by renaming to `postcss.config.cjs`.

### DevTools console errors on startup

Common noise you can ignore in dev:

- `Request Autofill.enable failed` — Chromium DevTools trying to bind features not available in Electron.
- `GPU process exited unexpectedly` — GPU crash on some Macs during DevTools open. Self-heals.
- `Network service crashed` — same as above; Chromium auto-recovers.

If they persist across launches and the app misbehaves, try deleting `out/` and `node_modules/.vite` and rebuilding.

### HMR doesn't pick up renderer changes

Occasionally `vite` loses the file watcher.

- Quit the dev process (`Ctrl+C` in the terminal).
- Run `rm -rf node_modules/.vite out` then `npm run dev` again.

If it happens on every change, check your editor isn't using atomic-save (IntelliJ default). Disable it or switch to "safe-write off" so file watchers see incremental saves.

## Capture

### `Error occurred in handler for 'capture:trigger': Failed to get sources.`

macOS Screen Recording permission has not been granted. `desktopCapturer.getSources()` throws this generic error whenever the OS blocks enumeration.

Fix:

1. Open **System Settings → Privacy & Security → Screen & System Audio Recording**.
2. Toggle on **PrepOS** (packaged build) or **Electron** (dev build — the dev binary identifies itself as Electron since it isn't signed as PrepOS yet).
3. Fully quit and relaunch the app. macOS only re-reads this permission on process start.

PrepOS detects `denied` / `restricted` status before enumerating and pops a dialog with a button that deep-links to the right System Settings panel (`x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`). On first launch (status `not-determined`) the app intentionally attempts the capture so macOS shows its own native consent dialog.

### `Cmd+Shift+A` does nothing

Checks:

1. Is the app focused? `globalShortcut.register` should work regardless, but some macOS setups de-register shortcuts when the app hides.
2. Is Screen Recording permission granted? See the entry above.
3. After granting, restart the app (macOS requires a re-launch for the permission to take effect).

### Capture returns a pitch-black PNG

Usually the Screen Recording permission is not actually granted. macOS shows an empty/dark thumbnail when `desktopCapturer` is called without permission. Grant + relaunch.

### Capture is low-resolution / blurry

The overlay sends CSS-pixel coordinates; main must multiply by `scaleFactor`. If you changed `capture.ts` recently, verify `NativeImage.crop` receives device-pixel coords. On a 2x display, a 200×100 CSS selection = 400×200 device pixels.

### Capture crops the wrong part of the screen

Multi-monitor setup? Currently the overlay covers only the display where the trigger was fired. Cross-display selection isn't supported yet. Bring the cursor to the display you want to capture before pressing the shortcut.

## AI

### "No API key set" response

Open **Settings → AI** and paste a key. If you already did, check that `safeStorage.isEncryptionAvailable()` returns `true`. On some CI / remote Linux environments it returns `false` and `store.ts` falls back to plaintext — still works, just logs a warning.

### OpenAI responses say "model does not support images"

Pick a vision-capable model. `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` all support images. Vanilla `gpt-3.5-turbo` does not. Settings → AI → Model dropdown.

### Anthropic returns 400 with "invalid type: image"

Wrong API version. Main sends `anthropic-version: 2023-06-01` which supports images. If you forked and changed it, images won't work. Revert.

### AI request hangs forever

No timeout is set on the provider call. If your network drops mid-request, the renderer's spinner will spin indefinitely. Workaround: close the message bubble (stub; we swallow errors silently in some paths). Future: add `AbortController` + 60s timeout to `ai-gateway.ts`.

## Webview plugins

### Site shows "X-Frame-Options deny" error

Some sites (e.g., Google login flows) refuse to render inside iframes/webviews. `<webview>` is not an iframe and works on most major sites, but for strict ones, you'll need to open them in the system browser: use the "Open in browser" button in the WebviewHost toolbar.

### Login doesn't persist

Partitions must start with `persist:` to survive across app launches. Double-check that in the plugin manifest (`webview.partition` should be something like `persist:leetcode`). Without `persist:`, cookies live in-memory and disappear on quit.

### "script-src" CSP error in webview

Only applies to the top-level renderer (where our CSP is declared). Webviews have their own CSP from the site they load. If you see this, it's the app's renderer, not the webview — check `src/renderer/index.html` CSP header.

## Typechecking

### `TS2717: Subsequent property declarations must have the same type`

Happens when `window.prepOS` is declared twice with different types. Our typings are centralized:

- `ElectronAPI` defined once in `src/shared/types.ts`.
- Global `window.prepOS` declared once in `src/renderer/src/electron.d.ts`.
- `src/main/preload.ts` types its local `api` as `ElectronAPI` but doesn't re-declare global.

If you refactored and saw this error, reset to the above layout.

### `JSX element 'webview' has no type`

Add the declaration back to `src/renderer/src/electron.d.ts`:

```ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        partition?: string;
        allowpopups?: string;
        preload?: string;
        useragent?: string;
      };
    }
  }
}
```

## Security warnings in DevTools

```
Electron Security Warning (Insecure Content-Security-Policy)
```

Our CSP allows `'unsafe-inline'` in dev because Monaco and Tailwind JIT emit inline styles. In production we can tighten. Until then the warning is expected and benign in dev.

## Packaging

### `dist:mac` fails with "Code signing is required"

Either set the signing env vars (see [build-and-release.md#macos](build-and-release.md#macos)) or explicitly opt out:

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac
```

Unsigned artifacts are fine for local testing. Don't distribute them.

### `dist:linux` fails with "libappindicator not found"

Missing system lib on your Linux host. `sudo apt install libappindicator3-1` on Debian/Ubuntu. The AppImage can still launch on machines without it because AppImages bundle libs.

### DMG builds on Linux?

Technically electron-builder supports macOS cross-builds from Linux via `Darwin toolchain`, but **don't**. Codesigning requires `codesign` which is macOS-only, and the produced DMG won't notarize. Always build macOS artifacts on a Mac.

## "The app feels slow"

In dev, a single `BrowserWindow` with HMR + React DevTools is heavier than the production bundle. Run `npm run build && npm start` to test perceived performance against the packaged output. If it's still slow:

- Profile the renderer via Electron DevTools → Performance tab.
- Check for animations running on offscreen elements (Framer Motion loves to keep paint going).
- Ensure `webview` plugins aren't being re-mounted on every window focus change (the `<webview>` tag is expensive to create).

## I'm really stuck

1. Re-read the relevant doc in this folder.
2. Search the codebase for the channel name / file name / class name.
3. Check closed issues on the upstream projects:
   - electron/electron
   - alex8088/electron-vite
   - sindresorhus/electron-store
4. As a last resort, clean boot: `rm -rf node_modules out release && npm install && npm run dev`.
