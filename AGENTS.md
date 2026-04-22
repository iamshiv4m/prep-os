# AGENTS.md — guidance for AI coding agents

This file is the entry-point for any AI coding agent (Cursor, Claude, Copilot, etc.) working on **PrepOS**. Read this first, then go deep via [`docs/`](docs/).

## TL;DR

- **What it is:** Electron + React + TypeScript desktop app that looks like a mini macOS inside one window. Built for tech interview prep. Signature feature: screenshot any region of screen → ask AI about it inside the app.
- **Stack:** Electron 33, electron-vite, React 18, TypeScript (strict), Tailwind CSS, Framer Motion, Zustand, Monaco Editor, electron-store + safeStorage.
- **Not a web app.** Uses `<webview>`, global shortcuts, tray, safeStorage, desktopCapturer — all require the Electron runtime.

## Before editing anything

1. Read [`docs/architecture.md`](docs/architecture.md) — understand main ↔ preload ↔ renderer boundaries.
2. Read [`docs/ipc-reference.md`](docs/ipc-reference.md) — if your change crosses the main/renderer boundary, IPC must be added on both sides.
3. Run `npm run typecheck` after edits. No `any` without justification.

## Project layout map

```
prep-os/
├── AGENTS.md                    <- you are here
├── README.md                    <- user-facing quick start
├── docs/                        <- full documentation
├── electron.vite.config.ts      <- main + preload + renderer bundler config
├── electron-builder.yml         <- packaging (DMG/NSIS/AppImage)
├── tailwind.config.js
├── tsconfig.node.json           <- TS config for main + preload
├── tsconfig.web.json            <- TS config for renderer
├── src/
│   ├── main/                    <- Electron main process (Node, CJS)
│   │   ├── index.ts             <- app entry, BrowserWindow, shortcuts, tray
│   │   ├── preload.ts           <- contextBridge API surface
│   │   ├── ipc.ts               <- all ipcMain.handle / ipcMain.on
│   │   ├── capture.ts           <- region screenshot overlay + crop
│   │   ├── ai-gateway.ts        <- OpenAI + Anthropic HTTP clients
│   │   ├── plugins.ts           <- built-in + user-added plugin registry
│   │   └── store.ts             <- electron-store + safeStorage wrapper
│   ├── renderer/                <- React app (browser runtime)
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx          <- shell root: mounts Desktop, Menubar, Dock, windows
│   │       ├── electron.d.ts    <- global `window.prepOS` + <webview> JSX types
│   │       ├── styles.css       <- Tailwind entry + OS-level CSS
│   │       ├── components/      <- Desktop, Dock, Menubar, Launchpad, Spotlight, Window
│   │       ├── apps/            <- AIChat, Notes, Playground, Settings, WebviewHost, AppRouter
│   │       ├── store/           <- Zustand stores: windows, plugins, shell
│   │       └── utils/
│   └── shared/
│       └── types.ts             <- types shared across main + renderer
├── resources/                   <- app icons, wallpapers (user-supplied)
├── build/                       <- entitlements.mac.plist, codesign resources
├── out/                         <- build output (gitignored)
└── release/                     <- electron-builder output (gitignored)
```

## Hard rules for agents

### 1. Respect the process boundary

- **Main process (`src/main/`)** runs in Node.js. Can use `fs`, `electron`, `safeStorage`. **Never import** main-process modules from `src/renderer/`.
- **Renderer (`src/renderer/`)** runs in Chromium sandbox. Has **no Node APIs**. Can only talk to main via `window.prepOS.*`.
- **Preload (`src/main/preload.ts`)** is the only bridge. All IPC channel names live there + in `src/main/ipc.ts`.
- **Shared types (`src/shared/types.ts`)** can be imported from both sides. Only types — no runtime values that depend on electron/node.

### 2. CommonJS for main, ESM for renderer

Electron main is built as CJS. **Pure-ESM packages break it.** Do NOT add:

- `nanoid` v5+ (we pin v3)
- `electron-store` v10+ (we pin v8)
- Any other ESM-only package to `dependencies` if it's used in `src/main/`

If you need an ESM-only package in main, use dynamic `await import()` inside an async function, like we do for `electron-updater` in `src/main/index.ts`.

### 3. IPC contract is single-source

When adding a new IPC channel, update **all three** in one change:

1. `src/main/ipc.ts` — register the handler with `ipcMain.handle(...)` or `ipcMain.on(...)`
2. `src/main/preload.ts` — expose a typed method via `contextBridge`
3. `src/shared/types.ts` — add the method signature to `ElectronAPI`

If any one is missing, TypeScript or runtime will fail silently in the renderer.

### 4. Security defaults are non-negotiable

Never change these in `BrowserWindow` webPreferences:

- `contextIsolation: true`
- `nodeIntegration: false`

`sandbox: false` is currently accepted because our preload imports `electron-store` types. If you can make it `true`, please do.

### 5. API keys

- **Never** write API keys to JSON plaintext or log them.
- Use `safeStorage.encryptString` in `src/main/store.ts` — already wired via `setApiKey` / `getApiKey`.
- Renderer must fetch keys through `window.prepOS.settings.getApiKey(provider)` — not store them locally.

### 6. Styling

- Use Tailwind utility classes. No CSS modules, no CSS-in-JS.
- Glassmorphism tokens (see `docs/renderer.md`): `bg-white/10 backdrop-blur-xl border border-white/15`.
- Rounded corners: 10px for windows, 16-22px for dock/launchpad cards, 6-8px for buttons.
- System font stack is in [`tailwind.config.js`](tailwind.config.js) and [`styles.css`](src/renderer/src/styles.css) — use `font-sans`.

### 7. No hand-written comments narrating code

Code must be self-explanatory via names. Comments only for non-obvious intent (why, not what).

## Common tasks (playbook)

### Add a new built-in plugin

Edit `src/main/plugins.ts` → append to `BUILT_IN_PLUGINS`. If `type: 'webview'` you're done. If `type: 'native'`:

1. Create `src/renderer/src/apps/MyApp.tsx`
2. Register it in `src/renderer/src/apps/AppRouter.tsx` under the matching `entry` string
3. Set `entry: 'my-app'` in the plugin manifest

### Add a new IPC method

See rule #3 above. See [`docs/ipc-reference.md`](docs/ipc-reference.md) for the current surface.

### Add a new keyboard shortcut

- **App-local** (renderer, only when app is focused): add to the `onKey` effect in `src/renderer/src/App.tsx`.
- **Global** (OS-wide, works even when app is in background): register in `registerShortcuts()` in `src/main/index.ts` via `globalShortcut.register`.

### Touch the capture overlay

`src/main/capture.ts` renders an HTML string into a transparent BrowserWindow. It uses the same preload as the main window and calls `window.prepOS.capture.commitRegion(...)` / `.cancelRegion()`. If you change the overlay HTML, keep those two calls intact.

## Deep-dive docs

| Topic                           | File                                                   |
| ------------------------------- | ------------------------------------------------------ |
| Architecture + dataflow diagram | [docs/architecture.md](docs/architecture.md)           |
| Dev + build quickstart          | [docs/getting-started.md](docs/getting-started.md)     |
| Main-process internals          | [docs/main-process.md](docs/main-process.md)           |
| Renderer + UI conventions       | [docs/renderer.md](docs/renderer.md)                   |
| Plugin system                   | [docs/plugins.md](docs/plugins.md)                     |
| Capture → AI flow               | [docs/capture-and-ai.md](docs/capture-and-ai.md)       |
| IPC channel catalog             | [docs/ipc-reference.md](docs/ipc-reference.md)         |
| Packaging + signing             | [docs/build-and-release.md](docs/build-and-release.md) |
| Debugging + known gotchas       | [docs/troubleshooting.md](docs/troubleshooting.md)     |

## Quick commands

```bash
npm install             # first time
npm run dev             # dev with HMR
npm run typecheck       # strict TS check (main + renderer)
npm run lint            # ESLint, zero warnings allowed
npm run lint:fix        # ESLint auto-fix
npm run format          # Prettier write
npm run check           # typecheck + lint + format:check (the one command to run before committing)
npm run build           # production bundle into out/
npm run dist:mac        # DMG + zip for macOS (arm64 + x64)
npm run dist:win        # NSIS installer for Windows
npm run dist:linux      # AppImage + deb
```

Before declaring a task done, run `npm run check`. If any of the three gates (typecheck, lint, format) fails, **fix it before committing**.
