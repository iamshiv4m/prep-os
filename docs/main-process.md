# Main process

Everything in `src/main/` runs in Node.js inside Electron. It has full filesystem, network, and OS access. The renderer gets to use these capabilities only through the methods exposed by [`preload.ts`](../src/main/preload.ts).

## File-by-file

### [`src/main/index.ts`](../src/main/index.ts) — app entry

Responsible for:

- Creating the single `mainWindow` with macOS `hiddenInset` traffic lights, vibrancy, `webviewTag: true`.
- Wiring the preload script into `webPreferences`.
- Loading the Vite dev URL in dev (`process.env.ELECTRON_RENDERER_URL`) or the built `out/renderer/index.html` in prod.
- Installing the native app menu (macOS) via `buildAppMenu`.
- Registering global shortcuts via `registerShortcuts` (currently just `Cmd+Shift+A` for region capture).
- Creating the system tray with "Show / Capture / Quit" items (`createTray`).
- Scheduling the website-based update check in packaged builds only (`setupUpdateCheck` → [`src/main/update-checker.ts`](../src/main/update-checker.ts)). We deliberately don't use `electron-updater` — code signing is a paid/platform-specific chore, so instead the checker just fetches GitHub's latest release on boot and, if newer than `app.getVersion()`, pushes an `update:available` event to the renderer. The renderer shows a dismissible banner (`UpdateBanner.tsx`) that deep-links back to the website's download page. Manual re-install, zero certs.
- Calling `setupIPC()` to register all IPC channels before the window loads.

Lifecycle hooks:

- `app.whenReady()` — bootstrap everything.
- `app.on("before-quit")` — if the focus guard is active ([`focus-guard.ts`](../src/main/focus-guard.ts)), intercept and show a modal dialog. Only forwards the quit if the user chooses "End Session & Quit" — in which case it also sends `focus:forceEnd` to the renderer so the session is recorded correctly.
- `app.on("window-all-closed")` — quit on non-macOS (standard Electron pattern; macOS apps stay alive in the dock).
- `app.on("will-quit")` — unregister all global shortcuts.
- `app.on("activate")` — re-create window when macOS dock icon is clicked after all windows closed.

### [`src/main/preload.ts`](../src/main/preload.ts) — the bridge

Runs in an isolated Chromium world. The only way the renderer gets anything from main. Everything exposed is defined by the `ElectronAPI` interface in [`src/shared/types.ts`](../src/shared/types.ts) — one source of truth.

What the preload does:

- Imports `contextBridge` and `ipcRenderer` from `electron`.
- Builds an `api: ElectronAPI` object where each property just calls `ipcRenderer.invoke(...)` or `.send(...)`.
- Calls `contextBridge.exposeInMainWorld("prepOS", api)` so the renderer sees `window.prepOS`.
- Listens for `capture:ready` events from main and rebroadcasts to any subscribers registered via `prepOS.captures.onReady(cb)`.

This file is also used as the preload for the capture overlay window (see `capture.ts` below), because the overlay calls `window.prepOS.capture.commitRegion(...)`. Same preload, same typed surface — no duplicate security code.

### [`src/main/ipc.ts`](../src/main/ipc.ts) — IPC handlers

`setupIPC(getMain)` accepts a getter for the main `BrowserWindow` (so capture handlers can `send` back to it). It registers all channels for:

- App info: `app:getVersion`, `app:getPlatform`
- Window controls: `window:minimize`, `window:maximize`, `window:close` (for custom title bars; not used on macOS since we keep the native traffic lights)
- Settings: `settings:get`, `settings:update`, `settings:getApiKey`, `settings:setApiKey`
- Plugins: `plugins:list`, `plugins:add`, `plugins:remove`
- Capture: `capture:trigger`, `capture:list`, `capture:remove`, `capture:commitRegion`, `capture:cancelRegion`
- AI: `ai:chat`
- Chat persistence: `chat:listSessions`, `chat:saveSession`, `chat:removeSession`
- Notes: `notes:list`, `notes:save`, `notes:remove`
- Focus: `focus:list`, `focus:append`, `focus:clear`, `focus:setGuard`
- Tips: `tips:today`, `tips:all`
- Feed: `feed:sources`, `feed:list`, `feed:refresh`
- `shell:openExternal` — guarded to only allow `http/https`.

Full channel reference in [ipc-reference.md](ipc-reference.md).

### [`src/main/focus-guard.ts`](../src/main/focus-guard.ts) — quit lock

Tiny module holding a single boolean — whether the app is in a "hard focus" state. Exposes `setFocusGuard(active)` (called from `focus:setGuard` IPC), `isFocusGuardActive()`, and `setOnFocusGuardChanged(cb)` (consumed by `index.ts` so the `before-quit` handler can react without importing circular code).

### [`src/main/feed.ts`](../src/main/feed.ts) — RSS aggregator

Hardcodes a curated list of sources (`FEED_SOURCES`) with an `icon`, display name, homepage and RSS URL. `refreshFeed()` fires all sources in parallel using the global `fetch` with an 8s timeout, feeds each response into an RSS-or-Atom-aware parser (`fast-xml-parser` + manual normalization), dedupes by URL, sorts by `publishedAt` desc, and caps to 120 items. Result is written to `feedCache` in `electron-store` so cold starts have instant content.

`listFeed()` returns the cache if it's under 20 minutes old, otherwise triggers a refresh. A single in-flight promise is shared so concurrent callers never double-fetch.

### [`src/main/capture.ts`](../src/main/capture.ts) — region screenshots

Exports:

- `captureRegion(): Promise<Capture | null>` — opens the overlay and returns a promise that resolves when the user finishes the selection (or cancels).
- `commitCaptureRegion(region)` — called by the overlay when the user releases the mouse. Crops the PNG and persists it.
- `cancelCapture()` — called on `Escape` or when the user clicks without dragging.
- `listCaptures()` / `removeCapture(id)` — for later retrieval.

How the overlay works:

1. `desktopCapturer.getSources({ types: ['screen'] })` pulls a high-res PNG of every display at device-pixel resolution.
2. An HTML string with an embedded `<canvas>` is built on-the-fly and loaded into a **new transparent BrowserWindow** using `data:text/html;...`. This window uses the same `preload.js` as the main window, so `window.prepOS` is available inside it.
3. The overlay draws the screen PNG into the canvas, dims it with a semi-opaque overlay, and lets the user drag a selection rectangle.
4. On mouseup, the overlay calls `window.prepOS.capture.commitRegion({ x, y, width, height, displayId })`. That invokes `commitCaptureRegion` in main.
5. Main crops the original `NativeImage` using `.crop(...)` at device-pixel resolution, writes a PNG to `<userData>/captures/`, and pushes it into the store (cap 200 captures).
6. The pending `Promise` from `captureRegion` resolves with the `Capture` object. `index.ts`'s shortcut handler then sends `capture:ready` to the main renderer, which opens the AI Chat window seeded with the capture.

### [`src/main/ai-gateway.ts`](../src/main/ai-gateway.ts) — LLM calls

`chatWithAI(req: AIChatRequest)` fans out to:

- `callOpenAI` — POSTs to `https://api.openai.com/v1/chat/completions`. Images are inlined as `data:` URLs in OpenAI's `image_url` message part format.
- `callAnthropic` — POSTs to `https://api.anthropic.com/v1/messages`. Includes `x-api-key` and `anthropic-version: 2023-06-01` headers. Images are sent as `{ type: "image", source: { type: "base64", media_type, data } }`. System messages become the top-level `system` field.

Errors from the providers are caught and returned as `{ content: "", error: "..." }` — the renderer shows the error in-bubble rather than crashing. API keys are fetched via `getApiKey(provider)` from `store.ts`; if missing, the gateway returns a user-facing "No API key set" message.

### [`src/main/plugins.ts`](../src/main/plugins.ts) — plugin registry

Hardcodes `BUILT_IN_PLUGINS: PluginManifest[]` — today DevTools Tech, LeetCode, HackerRank, GitHub, Excalidraw, YouTube, Feed, AI Chat, Notes, Playground, Settings. Built-in webview plugins point at public URLs; built-in native plugins use `entry: "ai-chat" | "notes" | "playground" | "feed" | "settings"` which `AppRouter.tsx` dispatches on.

`listPlugins()` returns built-ins concatenated with user plugins loaded from the store. `addUserPlugin(partial)` generates an id if missing, defaults missing fields (`version: "1.0.0"`, `window.defaultSize: 1100x760`), and persists. `removeUserPlugin(id)` is self-explanatory.

Full schema in [plugins.md](plugins.md).

### [`src/main/store.ts`](../src/main/store.ts) — persisted state

Wraps `electron-store@8` (pinned to CJS). Defines a single `PersistedShape` interface holding:

- `settings: AppSettings` — now includes `focusHardLock: boolean` (defaults to `false`).
- `encryptedKeys: Record<AIProvider, string | null>` — each value is a base64-encoded `safeStorage.encryptString(...)` result, or null.
- `userPlugins: PluginManifest[]`
- `captures: Capture[]`
- `chatSessions: ChatSession[]`
- `notes: Note[]`
- `focusSessions: FocusSession[]`
- `feedCache: FeedSnapshot | null` — last successful feed pull, so the Feed app renders instantly on cold start.

Exports typed getters/setters for each slice. API key access goes through `getApiKey(provider)` which transparently decrypts; `setApiKey(provider, value)` encrypts before writing. If `safeStorage.isEncryptionAvailable()` returns false (rare on CI or some Linux setups), it falls back to plaintext — noisy but useful for local dev.

## Adding a new main-process capability

Checklist:

1. Write the feature in `src/main/<feature>.ts` as a normal TypeScript module using Node + Electron APIs.
2. Register an IPC channel for it in `src/main/ipc.ts`.
3. Add the corresponding method to `ElectronAPI` in `src/shared/types.ts`.
4. Expose it in `src/main/preload.ts` with a one-line `ipcRenderer.invoke(...)` wrapper.
5. Call `window.prepOS.<your-method>(...)` from the renderer.
6. Run `npm run typecheck` to catch any signature mismatches across the boundary.

Do **not** import from `@main/...` inside `src/renderer/` — those paths only exist in `tsconfig.node.json` and will blow up the renderer build.

## Gotchas specific to main

- **CJS-only packages.** Electron's main is bundled as CJS. Pure-ESM packages (nanoid v5+, electron-store v10+, chalk v5+) will throw `ERR_REQUIRE_ESM` at runtime even though TypeScript is happy. Pin to CJS versions, or use `await import()` inside an async function.
- **No top-level await.** Same reason.
- **`__dirname` semantics.** In the built output, `__dirname` points at `out/main/`. Preload is at `out/preload/preload.js`. That's why `src/main/index.ts` uses `path.join(__dirname, "..", "preload", "preload.js")`.
- **Global shortcuts and permissions.** On macOS, `desktopCapturer` requires Screen Recording permission (System Settings → Privacy & Security). The first capture attempt triggers the prompt. Tray icons on macOS can render empty if no image is provided — we fall back to `nativeImage.createEmpty()` plus `setTitle("◆")`.
