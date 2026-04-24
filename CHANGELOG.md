# Changelog

All notable changes to PrepOS are documented here. Format is loosely based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-04

Initial public release. PrepOS is a desktop OS-style productivity shell for
engineers prepping for interviews and dev-life in general.

### Added

#### Desktop shell

- macOS-inspired menubar with PrepOS dropdown, dynamic per-app menus, live
  clock + calendar popover, and notifications inbox.
- Full-screen window manager: drag, resize, snap (left/right/top/bottom),
  maximize, minimize, ⌘W close, ⌘M minimize.
- Dock with hover magnification, auto-hide, drag-to-reorder, and contextual
  badges (focus, mode, lockdown).
- Spotlight (⌘K) fuzzy command palette over apps and actions.
- Launchpad app grid with quick-add for custom URLs.
- App switcher (⌘Tab parity).
- Persistent window sessions across launches.
- Desktop widgets: tasks, focus, mode picker, clock, daily tip — all
  interactive on the desktop surface.

#### Apps

- **AI Chat**: first-class app for OpenAI and Anthropic with vision
  support. `Cmd+Shift+A` (Win/Linux: `Ctrl+Shift+A`) captures a region of
  your screen and pipes it straight into the conversation.
- **Daily Feed**: a daily.dev-style reader pulling Hacker News, Dev.to,
  GitHub Trending, and a curated set of top-tier RSS sources covering
  frontend, backend, system design, AI, and career.
- **Notes**: local-first markdown notes with quick capture.
- **Playground**: Monaco-powered code scratchpad.
- **Settings**: API keys, focus options, dock behaviour, modes.

#### Productivity

- **Focus sessions**: timer-based focused work on any plugin. Opt-in
  **Hard focus** blocks `Cmd+Q` until the session ends.
- **Modes**: switchable workspace modes (Interview Prep, Deep Work,
  Reading, Writing, etc.) that customize the dock and ambient surface.
- **Lockdown Mode** (`Cmd+Shift+L`): blocks app switching while you're
  studying, opt-in.
- **Daily tip**: curated interview tip on the desktop, rotates daily.

#### Plugin system

- Add any web URL as a first-class app — tracked in the dock with favicon
  and persistent login session.
- Built-in plugins: DevTools Tech, LeetCode, HackerRank, GitHub,
  Excalidraw, YouTube.
- Per-plugin isolated `webview` partition so cookies don't leak between
  apps.

#### Platform

- **macOS** (arm64 + x64), **Windows** (x64 NSIS installer), **Linux**
  (AppImage + deb).
- All external URLs are intercepted and opened inside the in-app browser
  rather than escaping to the system browser, so the app stays the
  centre of attention.
- Hardened web contents: `contextIsolation`, no `nodeIntegration`,
  permission requests denied by default.

#### Updates

- Website-driven update checker — on boot PrepOS pings GitHub for the
  latest release and shows a dismissible banner that deep-links back to
  the download page. Manual re-install, zero code-signing cost.
- Manual "Check for Updates…" available in the menubar.

#### Other

- React `ErrorBoundary` at the root for crash recovery.
- API keys encrypted via Electron `safeStorage` (OS keychain backed).
- Persistence size caps to keep `electron-store` from growing
  unbounded with chat history or notes.

[Unreleased]: https://github.com/iamshiv4m/prep-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/iamshiv4m/prep-os/releases/tag/v0.1.0
