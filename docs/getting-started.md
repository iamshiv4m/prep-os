# Getting started

A fresh clone should be running in under two minutes on any modern Mac / Windows / Linux machine.

## Prerequisites

- **Node.js 18+** (tested with 22 and 23)
- **npm 9+** (ships with Node)
- macOS 11+, Windows 10+, or any modern Linux with X11 / Wayland

No Rust, Python, or native toolchain is strictly required for development. For packaging DMGs on macOS you'll want Xcode Command Line Tools (`xcode-select --install`).

## First run

```bash
git clone <your-fork-url> prep-os
cd prep-os
npm install
npm run dev
```

The dev command does three things in parallel:

1. **electron-vite** rebuilds `src/main/index.ts` → `out/main/index.js` (CJS, Node).
2. It also rebuilds `src/main/preload.ts` → `out/preload/preload.js`.
3. A Vite dev server serves the renderer at `http://localhost:5173` with HMR.

Then it spawns Electron, which loads the dev server URL inside the `BrowserWindow` (see [`src/main/index.ts`](../src/main/index.ts)). DevTools auto-opens in detached mode.

## Verifying it works

When the app starts you should see:

- A gradient wallpaper with the **PrepOS** hero text and quick-start chips
- A glassmorphic dock at the bottom with emoji icons
- A top menubar with clock, Capture, AI, Spotlight buttons
- Keyboard shortcuts working:
  - `Cmd+K` → Spotlight command palette
  - `Cmd+L` → Launchpad grid
  - `Cmd+,` → Settings window
  - `Cmd+Shift+A` → region capture overlay

## Configure AI to enable the signature feature

1. Open **Settings** (`Cmd+,` or Launchpad → Settings).
2. Paste a key into **OpenAI API Key** or **Anthropic API Key**.
3. Click **Save**. The key is encrypted via `safeStorage` before being written to disk.
4. Choose the provider + model in the **AI Provider** section.
5. Try `Cmd+Shift+A`, drag a region. The AI Chat window opens with the screenshot attached. Type a question and hit Enter.

> For vision-capable results, keep the OpenAI default `gpt-4o-mini` or switch to `gpt-4o`. On Anthropic use `claude-3-5-sonnet-latest` (or the latest vision-capable model they offer).

## Scripts reference

All scripts live in [`package.json`](../package.json).

| Script                          | What it does                                                              |
| ------------------------------- | ------------------------------------------------------------------------- |
| `npm run dev`                   | HMR dev loop: Vite renderer + electron-vite main/preload + Electron spawn |
| `npm run build`                 | Production bundle into `out/` (main + preload + renderer)                 |
| `npm run preview` / `npm start` | Run the `out/` bundle with Electron (no HMR)                              |
| `npm run typecheck`             | Strict `tsc --noEmit` for both tsconfigs                                  |
| `npm run lint`                  | ESLint across the repo, zero warnings allowed                             |
| `npm run lint:fix`              | ESLint auto-fix                                                           |
| `npm run format`                | Prettier write (formats the whole repo)                                   |
| `npm run format:check`          | Prettier check only (CI-friendly)                                         |
| `npm run check`                 | typecheck + lint + format:check — full quality gate                       |
| `npm run pack`                  | Build + electron-builder `--dir` (unpacked app, useful for local testing) |
| `npm run dist`                  | Build + full installer/distributable for current platform                 |
| `npm run dist:mac`              | DMG + ZIP (arm64 + x64)                                                   |
| `npm run dist:win`              | NSIS installer (x64)                                                      |
| `npm run dist:linux`            | AppImage + deb                                                            |

### Code style and linting

- **Prettier** formats code, markdown, JSON, YAML. Config in [`.prettierrc`](../.prettierrc); ignore list in [`.prettierignore`](../.prettierignore). Tailwind class ordering is enabled via `prettier-plugin-tailwindcss`.
- **ESLint** uses the flat config in [`eslint.config.mjs`](../eslint.config.mjs). Rules are scoped per area: Node globals for `src/main/`, browser + React rules for `src/renderer/`, `eslint-config-prettier` applied last so ESLint never fights Prettier.
- **EditorConfig** — [`.editorconfig`](../.editorconfig) keeps indentation + line endings consistent across editors.

Before committing, run `npm run check` — one command covers typecheck + lint + format.

## Workspace layout (what you'll touch most)

Add a UI feature → usually `src/renderer/src/components/` or `src/renderer/src/apps/`.

Add a capability that needs Node APIs → `src/main/` + expose through `src/main/preload.ts` + declare in `src/shared/types.ts`.

Add a new "app" users can open from the dock → `src/main/plugins.ts` (manifest) + optionally `src/renderer/src/apps/YourApp.tsx` + register in `AppRouter.tsx`.

## If something goes wrong on first run

See [troubleshooting.md](troubleshooting.md). The most common issue is adding a pure-ESM npm package to the main process by mistake (see note on `nanoid` / `electron-store` versions).

## IDE setup tips

- **Cursor / VS Code:** install the Tailwind CSS IntelliSense extension and the ESLint extension. Both pick up config automatically.
- **TypeScript version:** use workspace version so path aliases `@main/*`, `@shared/*`, `@renderer/*` resolve.
- **React DevTools:** the Electron DevTools window is just Chromium DevTools — install the React DevTools extension via `chrome://extensions` inside it if you want the Components tab.
