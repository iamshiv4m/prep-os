# Renderer

The renderer is a plain React 18 app. No router, no SSR. It renders a macOS-like shell inside the Electron `BrowserWindow` and delegates everything persistent / network-touching to main via `window.prepOS`.

## Entry chain

```text
src/renderer/index.html
  → loads src/renderer/src/main.tsx
    → renders <App />
      App.tsx mounts: <Desktop/> <Menubar/> <Windows/> <Dock/> <Launchpad/> <Spotlight/>
```

`main.tsx` also imports `styles.css` (Tailwind directives + OS-level CSS) and `electron.d.ts` augments the global `Window` with `prepOS: ElectronAPI` and adds the `webview` JSX intrinsic element.

## Components

Every component file is under `src/renderer/src/components/` or `src/renderer/src/apps/`. Keep components small; put persistence and networking behind the preload.

### [`App.tsx`](../src/renderer/src/App.tsx)

Top-level shell orchestrator.

- On mount: `plugins.refresh()`, then subscribes to `window.prepOS.captures.onReady(...)`. When a capture arrives, it opens (or focuses) a dedicated AI Chat window and passes the capture as initial state.
- Global keyboard handler: `Cmd+K` toggles spotlight, `Cmd+L` toggles launchpad, `Cmd+,` opens settings, `Cmd+Shift+A` asks main to trigger capture.
- Renders the layered shell (desktop → menubar → windows → dock → overlays).

### [`components/Desktop.tsx`](../src/renderer/src/components/Desktop.tsx)

Static visual layer. Gradient wallpaper + hero greeting + quick-start chips that dispatch to `windows.openApp(plugin)`. Clicking empty desktop clears focus (`windows.focus(null)`).

### [`components/Menubar.tsx`](../src/renderer/src/components/Menubar.tsx)

Frosted top bar. Left: app name + focused window title. Right: Capture button (calls main), AI button, Spotlight button, live clock. Declares `-webkit-app-region: drag` via `.drag-region` class so the user can move the Electron window from the menubar (macOS `hiddenInset` leaves the space drag-free by default).

### [`components/Dock.tsx`](../src/renderer/src/components/Dock.tsx)

The money shot. Uses Framer Motion `useMotionValue` + `useTransform` to implement macOS-style dock magnification driven by pointer X distance. Each dock item scales + lifts + glows as the cursor approaches.

Also renders:

- Launchpad trigger icon (opens `shell.setLaunchpadOpen(true)`)
- Minimized window chiclets on the right, so users can click to restore.

### [`components/Launchpad.tsx`](../src/renderer/src/components/Launchpad.tsx)

Full-screen app grid with blur + search input. Filters plugins by `name` / `description` substring. "Add custom app" card triggers a modal-less inline form that calls `plugins.addUserPlugin(...)` then refreshes.

### [`components/Spotlight.tsx`](../src/renderer/src/components/Spotlight.tsx)

Cmd+K command palette. Fuzzy search over apps + hardcoded actions (capture, settings, launchpad). Arrow keys navigate, Enter executes, Esc closes.

### [`components/Window.tsx`](../src/renderer/src/components/Window.tsx)

A single draggable/resizable window chrome. Features:

- Traffic lights (close / minimize / maximize).
- Framer Motion enter/exit with scale + opacity for the macOS "genie-lite" feel.
- Drag by titlebar, z-index bump on pointerdown (delegates to `windows.focus(id)` which increments `topZ`).
- Resize handles on edges/corners.
- Maximized state: fills minus menubar + dock heights.
- Children are rendered via `<AppRouter plugin={...} state={...} onStateChange={...} />` so each window gets to keep its own app state.

## App components (`src/renderer/src/apps/`)

### [`AppRouter.tsx`](../src/renderer/src/apps/AppRouter.tsx)

Switch on `plugin.type`:

- `webview` → `<WebviewHost src={plugin.window.entryUrl} partition={"persist:" + plugin.id} />`
- `native` → switch on `plugin.entry`:
  - `ai-chat` → `<AIChat initialCapture={state?.capture} />`
  - `notes` → `<Notes />`
  - `playground` → `<Playground />`
  - `feed` → `<Feed />`
  - `settings` → `<Settings />`
  - default → a "Not found" card with the entry key

### [`AIChat.tsx`](../src/renderer/src/apps/AIChat.tsx)

Chat UI wired to the AI gateway. Keeps a local list of `ChatSession`s synced with main via `chat:listSessions` / `chat:saveSession` / `chat:removeSession`.

- Sidebar: session list, "New chat" button.
- Main pane: message bubbles (with image thumbnails for captures), input with auto-grow textarea, send button.
- When seeded with a capture (from the signature flow), the first message pre-attaches the capture thumbnail and sets a friendly placeholder like "Ask about this screenshot…".
- Reads provider + model + API key via `settings.get` + `settings.getApiKey` before each request.

### [`Notes.tsx`](../src/renderer/src/apps/Notes.tsx)

Minimal Markdown editor. Sidebar with search and CRUD; main pane is a `<textarea>` for now (no preview). Auto-saves on blur and on a debounced timer. Notes sync with main through `notes:list` / `notes:save` / `notes:remove`.

### [`Playground.tsx`](../src/renderer/src/apps/Playground.tsx)

Monaco editor plus a sandbox runner. Users write JS/TS; clicking **Run** serializes the code into a disposable `<iframe>` with `sandbox="allow-scripts"` and an inline `postMessage` bridge that forwards `console.log` back to the parent. Logs render in a bottom panel.

### [`Settings.tsx`](../src/renderer/src/apps/Settings.tsx)

Tabbed UI for:

- **AI** — API key inputs (show/hide toggle), provider + model select, "encrypted via safeStorage" badge.
- **Shortcuts** — readonly list of global + local shortcuts.
- **About** — app version + platform from `app:getVersion` / `app:getPlatform`.

### [`Feed.tsx`](../src/renderer/src/apps/Feed.tsx)

A daily.dev-style reader. Sidebar: per-source filter with article counts + an error badge if a source failed its last fetch. Main pane: article list (title / description / relative time / author) with a sticky search input and refresh button. Clicking an article hands off to `shell.openExternal` so it opens in the user's real browser.

Source of truth lives in main ([`src/main/feed.ts`](../src/main/feed.ts)): RSS + Atom are both parsed via `fast-xml-parser`, in-memory + disk cached with a 20-minute TTL. Initial mount calls `feed.list()` (returns cache if fresh) and the Refresh button forces `feed.refresh()`.

### [`WebviewHost.tsx`](../src/renderer/src/apps/WebviewHost.tsx)

Thin wrapper around Electron's `<webview>` tag.

- Navigation bar: Back / Forward / Reload / Home / Open in default browser (sends URL to `shell:openExternal`).
- Address input for reading the current URL.
- Optional CSS injection via `webview.insertCSS(...)` to tweak embedded sites (e.g., hide ads / headers).
- `allowpopups` is set so sites that open new windows work.

> `<webview>` does not participate in React's reconciliation well. Avoid re-mounting the node; pass a stable `key` and use refs for imperative control.

## Zustand stores (`src/renderer/src/store/`)

### [`windows.ts`](../src/renderer/src/store/windows.ts)

Single store for the entire window manager.

State:

```ts
WindowState = {
  id: string
  pluginId: string
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  focused: boolean
  minimized: boolean
  maximized: boolean
  preMaximizeBounds?: { x, y, width, height }
  appState?: unknown // opaque per-app state (e.g. AI Chat initial capture)
}
```

Actions: `openApp(plugin, state?)`, `focus(id | null)`, `close(id)`, `minimize(id)`, `restore(id)`, `toggleMaximize(id)`, `move(id, pos)`, `resize(id, size)`, `setAppState(id, state)`.

`topZ` auto-increments on each `focus()`. Windows cascade their initial position by a small offset per new window to avoid perfect overlap.

### [`plugins.ts`](../src/renderer/src/store/plugins.ts)

Mirrors the main-process plugin list. `refresh()` calls `window.prepOS.plugins.list()`. `addUserPlugin(partial)` and `remove(id)` proxy to main and then refresh.

### [`shell.ts`](../src/renderer/src/store/shell.ts)

UI toggles only: `launchpadOpen`, `spotlightOpen`. Keyed effects in `App.tsx` read these.

### [`focus.ts`](../src/renderer/src/store/focus.ts)

Focus session tracking. Holds the live session (`active`, `startedAt`, `targetPluginId`, `targetPluginName`, `targetPluginIcon`, `pickerOpen`) plus `hardLock: boolean` (mirrors `AppSettings.focusHardLock`) and the persisted `sessions[]` list hydrated from main.

Actions: `refresh()`, `start(plugin)`, `end()` (persists via `window.prepOS.focus.append` when the session lasted at least 10s), `openPicker()`, `closePicker()`, `clearHistory()`, `setHardLock(enabled)`.

Pure selectors exported from the same file for derived stats: `todayMs`, `yesterdayMs`, `last7DaysMs` / `thisWeekMs`, `perPluginMs`, `recentSessions`, plus formatters `formatDuration` / `formatTimer`.

Strict-mode auto-end is implemented as an effect in `App.tsx` that watches `windows.focusedId` and calls `end()` as soon as the focused plugin drifts off the session's target (or the target window is closed).

**Hard focus mode.** When `hardLock` is on **and** a session is active, `start()` calls `focus.setGuard(true)` on main, which flips a flag read by the `before-quit` handler. Any `Cmd+Q` / tray quit attempt now shows a confirmation dialog. Choosing "End Session & Quit" sends `focus:forceEnd` to the renderer; `App.tsx` subscribes via `window.prepOSEvents.onFocusForceEnd` and ends the session before the app actually quits. Toggle lives in **Settings → Focus → Hard focus mode**.

## Styling

### Tailwind

Config in [`tailwind.config.js`](../tailwind.config.js):

- `darkMode: "class"` (we default to dark-ish glass, but keep the toggle hook alive).
- Custom fonts: `font-sans` = SF Pro Text / SF Pro Display / system stack; `font-mono` = JetBrains Mono / Menlo.
- Custom animations (`dockBounce`, `fadeIn`, `slideUp`).

### CSS tokens

[`styles.css`](../src/renderer/src/styles.css) defines:

- `html, body, #root { height: 100% }` and `overflow: hidden` — we never scroll the shell itself.
- Webkit scrollbar styling (thin, semi-transparent).
- `.drag-region` and `.no-drag` for Electron's title-bar drag regions.
- `.wallpaper` — the base gradient plus an animated hue rotate.
- `.wallpaper-noise` — a subtle SVG noise overlay for that "real desktop" grain.
- `.traffic-light` — the three colored dots with their hover affordances.

### Glassmorphism recipe

For floating elements (dock, menubar, launchpad, spotlight, window chrome):

```css
bg-white/10 backdrop-blur-xl border border-white/15
shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)]
```

For darker surfaces (window title bars when focused):

```css
bg-neutral-900/70 backdrop-blur-2xl border border-white/10
```

Prefer these over inventing new combinations so the UI stays visually coherent.

## Accessing the main process

Everything goes through the `window.prepOS` typed surface:

```tsx
const settings = await window.prepOS.settings.get();
await window.prepOS.settings.setApiKey("openai", "sk-...");
const res = await window.prepOS.ai.chat({ messages, provider, model });
```

Do not create a fake REST client, do not call `fetch` to OpenAI/Anthropic from the renderer. The CSP will block it **and** your API key will leak into DOM.

See [ipc-reference.md](ipc-reference.md) for the full surface.
