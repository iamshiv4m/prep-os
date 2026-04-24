# Changelog

All notable changes to PrepOS are documented here. Format is loosely based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **First-run persona picker** — on first launch, choose between **College
  student**, **Working professional**, or **Custom** to pre-load a study mode
  and matching feeds. Re-trigger anytime from Settings → Personalize.
- **India / Career feed pack** — added GeeksforGeeks, **Striver (takeUforward
  YouTube)**, **NeetCode (YouTube)**, InterviewBit, freeCodeCamp, and GitHub
  Trending to the Dev News reader. They join a new **"Interview / Career"**
  category sitting at the top of the Feed sidebar. Marketing copy in the
  README, website, and IPC reference now matches the actual `FEED_SOURCES` in
  `src/main/feed.ts`.
- **Contest Calendar app + desktop widget** — new built-in `Contests` native
  app and desktop `ContestsWidget` showing upcoming **LeetCode Weekly /
  Biweekly** and **Codeforces** rounds with live countdowns. Data refreshes
  every 30 minutes and degrades gracefully (a failed platform falls back to
  cached entries instead of disappearing). New IPC surface
  `prepOS.contests.{list, refresh}`.
- **System Design native app** — built-in question library covering 18 classic
  problems (URL Shortener, Twitter/Threads timeline, Uber matching, Netflix
  streaming, Stock Exchange, Recommendation System, etc.) with structured
  problem statements, functional + non-functional requirements, hints, and
  vetted external references. Each question has **Open Excalidraw** and
  **Discuss with AI** entry points.
- **Settings → About now ships feedback links** — Report a bug, GitHub
  Discussions, "What's new" releases page, and a direct email — plus an
  explicit "no telemetry" callout.
- **`docs/launch-posts.md`** — copy-paste-ready Twitter, Hacker News (Show
  HN), Reddit, Dev.to, LinkedIn, and Discord launch posts for 0.1.0.

### Fixed

- README, website Features, and IPC reference previously claimed feed sources
  (freeCodeCamp, GitHub Trending) that were not yet wired up — claims now match
  reality, with India staples added on top.
- **GitHub Trending source is now resilient to mirror outages.** Primary path
  is still the community RSS mirror (`mshibanami.github.io`), but on failure
  we now fall back to scraping `github.com/trending` HTML directly so the
  source never silently empties when the mirror is rebuilding.

### Marketing / SEO

- Full website SEO pass: rich `metadata` with OpenGraph + Twitter cards in
  `app/layout.tsx`, generated 1200×630 `og.png` via `npm run og`, dual JSON-LD
  (`SoftwareApplication` + `Organization`), `app/sitemap.ts`, `app/robots.ts`,
  AVIF + WebP image formats, `<noscript>` fallback, and an a11y polish pass
  across Hero / Nav / Features / Footer / Downloads. Full audit lives at
  `docs/website-seo-audit.md`.

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
