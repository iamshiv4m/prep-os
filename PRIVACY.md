# Privacy

PrepOS runs entirely on your machine. By default, **no personal data, no
telemetry, and no analytics ever leave your device.** There are no PrepOS
servers to talk to.

## What's stored locally

All app state — settings, notes, AI chat history, focus sessions, captured
screenshots, plugin manifests, dock layout, mode preferences — lives on
your computer in Electron's standard `userData` directory:

- **macOS**: `~/Library/Application Support/PrepOS`
- **Windows**: `%APPDATA%\PrepOS`
- **Linux**: `~/.config/PrepOS`

API keys are never written in plaintext. They're encrypted with your OS
keychain via Electron's `safeStorage`:

- macOS Keychain
- Windows DPAPI
- Linux `libsecret` (Gnome Keyring / KWallet)

To wipe everything, uninstall the app and delete the folder above.

## What's sent to third parties

PrepOS only talks to external services when you explicitly trigger them:

- **AI Chat**: messages, captured screenshots, and conversation history go
  directly from your machine to the AI provider you configured (OpenAI or
  Anthropic) using the API key you provided. PrepOS does not log, mirror,
  or proxy these requests.
- **Daily Feed**: when you open the Feed app, PrepOS fetches public RSS /
  Atom feeds and the Hacker News API directly. Favicons come from Google's
  public S2 favicon service (`https://www.google.com/s2/favicons`).
- **In-app browser** (`<webview>`): plugins like LeetCode, GitHub, etc.
  load the actual third-party website inside an isolated session. Those
  sites see whatever they would normally see in a browser.
- **Update check**: on boot, PrepOS pings
  `https://api.github.com/repos/iamshiv4m/prep-os/releases/latest` to see
  if a newer version is available. No identifying information is sent —
  it's a standard unauthenticated GitHub API request.

That's the full network footprint.

## What we don't do

- No analytics or telemetry of any kind.
- No crash reporting (errors stay in your local devtools console).
- No accounts, no signup, no syncing — yet.
- No cookies set by PrepOS itself (third-party sites you load may set
  their own, scoped to their own webview partition).

## Cookies and third-party storage

Each plugin / pinned web app gets its own isolated `webview` partition
(`persist:<plugin-id>`). That means:

- Logins persist between launches (e.g. you stay signed into LeetCode).
- Cookies and `localStorage` are scoped per-plugin — LeetCode can't read
  GitHub's cookies and vice-versa.
- You can wipe a single plugin's data by removing it from Launchpad.

## Changes to this policy

If we ever add anything that changes the data flow above (e.g. opt-in
sync, opt-in crash reports), it'll be announced in `CHANGELOG.md` and the
release notes — and turned **off by default**, with a clearly labelled
toggle in Settings.

If you find a privacy concern, please follow the process in
[SECURITY.md](./SECURITY.md).
