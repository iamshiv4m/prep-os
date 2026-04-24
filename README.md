# PrepOS

A macOS-style desktop cockpit for tech interview prep, built with **Electron + React + TypeScript**.

PrepOS looks like a mini operating system inside one Electron window: desktop, dock, draggable / resizable windows, Launchpad and Spotlight. Every interview prep platform (LeetCode, HackerRank, DevTools Tech, etc.) is an "app" in the dock. The signature feature is **Capture → AI**: screenshot any region of your screen and ask GPT-4o / Claude about it directly inside the app.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/iamshiv4m/prep-os?include_prereleases&label=release)](https://github.com/iamshiv4m/prep-os/releases/latest)
[![Build](https://github.com/iamshiv4m/prep-os/actions/workflows/release.yml/badge.svg)](https://github.com/iamshiv4m/prep-os/actions/workflows/release.yml)

## Download

Grab the latest build for your OS from the **[releases page](https://github.com/iamshiv4m/prep-os/releases/latest)** or visit **[prepos.app](https://prepos.app)** for an OS-aware download experience.

| OS      | File                                                                      |
| ------- | ------------------------------------------------------------------------- |
| macOS   | `PrepOS-x.y.z-arm64.dmg` (Apple Silicon) / `PrepOS-x.y.z-x64.dmg` (Intel) |
| Windows | `PrepOS-Setup-x.y.z.exe` (NSIS installer)                                 |
| Linux   | `PrepOS-x.y.z.AppImage` / `prep-os_x.y.z_amd64.deb`                       |

> First launch on an unsigned build triggers an OS warning — see [bypass instructions](#first-launch-on-an-unsigned-build) below.

![OS shell preview](docs/preview.png) <!-- add a screenshot later -->

## Features

- **macOS-like shell** — Dock with magnification, draggable / resizable windows, traffic lights, Launchpad, Menubar.
- **Capture → AI** — global shortcut `Cmd+Shift+A` captures a screen region and pipes it into the AI Chat app with GPT-4o vision / Claude 3.5 Sonnet vision.
- **Plugin system** — built-in platforms (DevTools Tech, LeetCode, HackerRank, GitHub, Excalidraw, YouTube) + user-added custom web apps.
- **Native apps** — AI Chat, Markdown Notes, Monaco code Playground, Feed reader, Settings.
- **Focus mode** — start a timed session on any plugin. Opt into **Hard focus** to block `Cmd+Q` until the session ends.
- **Daily tip** — curated interview tip on the desktop, rotating daily.
- **Tech feed** — a daily.dev-style reader pulling Hacker News, Dev.to, freeCodeCamp, Smashing Magazine, CSS-Tricks, and GitHub Trending.
- **Spotlight** — `Cmd+K` fuzzy command palette for apps and actions.
- **Secure storage** — API keys encrypted via Electron `safeStorage` (macOS Keychain backed).

## Quickstart

Prerequisites: Node 18+ (tested with 22/23), macOS / Windows / Linux.

```bash
npm install
npm run dev
```

The dev shell opens an Electron window with HMR-enabled React renderer.

Add your OpenAI or Anthropic API key inside **Settings** (`Cmd+,` or from the Launchpad / Dock) to activate the AI chat.

## Build a distributable

```bash
npm run dist:mac     # DMG + zip for arm64 + x64
npm run dist:win     # NSIS installer
npm run dist:linux   # AppImage + deb
```

For signing / notarization on macOS, set `APPLE_ID`, `APPLE_ID_PASSWORD`, and `APPLE_TEAM_ID` env vars and flip `notarize: true` in [electron-builder.yml](electron-builder.yml).

### First-launch on an unsigned build

Because PrepOS is not yet signed / notarized, the OS will warn end-users on first launch. Share one of these workarounds with your early testers:

**macOS (Gatekeeper)**

> "PrepOS can't be opened because Apple cannot check it for malicious software."
> or
> "This item is on the disk image 'PrepOS-x.y.z-arm64.dmg'. Chrome downloaded this disk image today…"

1. **Don't run PrepOS from the DMG.** Open the DMG and **drag `PrepOS.app` onto the `/Applications` shortcut** next to it, then eject the DMG. Running straight from the mounted image causes the warning to repeat every launch.
2. Double-click `/Applications/PrepOS.app`. If macOS asks _"Are you sure you want to open it?"_ click **Open** — one-time confirmation, then you're in.
3. **If macOS blocks it outright** (common on macOS 15 Sequoia+, where Apple removed the _Open Anyway_ button for unsigned apps), strip the quarantine flag from Terminal:

   ```bash
   xattr -dr com.apple.quarantine /Applications/PrepOS.app
   ```

   Works on every macOS version. Double-click afterwards — no more warnings.

_Older macOS only:_ the GUI workaround also works — right-click `PrepOS.app` → **Open** → confirm in the dialog, or **System Settings → Privacy & Security → Open Anyway**. On Sequoia these are hidden; use the Terminal fix above.

**Windows (SmartScreen)**

> "Windows protected your PC."

1. Click **More info** in the blue dialog → **Run anyway**.
2. If SmartScreen silently blocks, right-click the installer → **Properties** → check **Unblock** at the bottom → **OK**, then run again.

**Linux (AppImage)**

1. Right-click the `.AppImage` → **Properties → Permissions → Allow executing as program** (or `chmod +x PrepOS-*.AppImage`).
2. Run it; on the first launch it integrates itself into your launcher.

## Architecture

```
src/
  main/       Electron main process (window, globalShortcut, IPC)
    index.ts        createMainWindow + shortcuts
    preload.ts      contextBridge API surface exposed to renderer
    capture.ts      region screenshot overlay + desktopCapturer
    ai-gateway.ts   OpenAI / Anthropic HTTP clients
    plugins.ts      built-in plugins + user-added plugin CRUD
    store.ts        electron-store wrapper (+ safeStorage for keys)
    ipc.ts          IPC handler registration
  renderer/   React app (the "OS" UI)
    App.tsx
    components/     Desktop, Menubar, Dock, Window, Launchpad, Spotlight
    apps/           AIChat, Notes, Playground, Settings, WebviewHost, AppRouter
    store/          Zustand stores: windows, plugins, shell
  shared/     Shared TypeScript types for main ↔ renderer
```

## Adding your own "app"

1. Click the **Launchpad** icon in the dock.
2. Click **+ Add**, give it a name, URL and an emoji/icon.
3. It appears in the Launchpad and Dock. Clicking launches the URL inside a sandboxed `<webview>` with persistent cookies (so logins survive).

Or programmatically edit [src/main/plugins.ts](src/main/plugins.ts) to add to `BUILT_IN_PLUGINS`.

## Security

- `contextIsolation: true`, no `nodeIntegration`, API surface limited through [src/main/preload.ts](src/main/preload.ts).
- API keys encrypted via `safeStorage` (macOS Keychain / Windows DPAPI / libsecret).
- Every webview gets an isolated `partition: persist:<plugin-id>` so cookies and localStorage are scoped per app.

## Documentation

Full documentation lives in [`docs/`](docs/). If you're new:

- **New developer?** Start with [docs/getting-started.md](docs/getting-started.md), then [docs/architecture.md](docs/architecture.md).
- **AI coding agent?** Read [AGENTS.md](AGENTS.md) first.
- **Extending the app?** See [docs/plugins.md](docs/plugins.md) and [docs/ipc-reference.md](docs/ipc-reference.md).
- **Packaging a release?** See [docs/build-and-release.md](docs/build-and-release.md).
- **Stuck?** Check [docs/troubleshooting.md](docs/troubleshooting.md).

Deep dives:

| Topic                                     | File                                                   |
| ----------------------------------------- | ------------------------------------------------------ |
| High-level architecture + diagrams        | [docs/architecture.md](docs/architecture.md)           |
| Main process file-by-file                 | [docs/main-process.md](docs/main-process.md)           |
| Renderer (UI components, stores, styling) | [docs/renderer.md](docs/renderer.md)                   |
| Plugin system + manifest schema           | [docs/plugins.md](docs/plugins.md)                     |
| Capture → AI flow end-to-end              | [docs/capture-and-ai.md](docs/capture-and-ai.md)       |
| IPC channel catalog                       | [docs/ipc-reference.md](docs/ipc-reference.md)         |
| Packaging + signing                       | [docs/build-and-release.md](docs/build-and-release.md) |
| Debugging + known gotchas                 | [docs/troubleshooting.md](docs/troubleshooting.md)     |

## Status

MVP covers Phases 0 → 5 of the plan. See the in-repo plan for the roadmap.
Release notes live in [CHANGELOG.md](CHANGELOG.md).

## Contributing

PRs and issues welcome — anything from bug reports to new built-in plugins
to UI polish. Before opening a PR:

- Run `npm run check` (typecheck + lint + format) and make sure it passes.
- For bigger features, open a discussion or draft PR first so we can align
  on direction.

For security issues, please **don't** open a public issue — see
[SECURITY.md](SECURITY.md) for the private reporting process.

## Privacy

PrepOS runs entirely on your machine — no telemetry, no analytics, no
servers. The only network traffic is to AI providers you configure
(OpenAI / Anthropic), public RSS feeds you subscribe to, and a once-per-boot
GitHub release check. Full details in [PRIVACY.md](PRIVACY.md).

## License

[MIT](LICENSE) © 2026 Shivam Jha.
