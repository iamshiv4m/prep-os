# Build and release

PrepOS is packaged with [`electron-builder`](https://www.electron.build/). The config lives in [`electron-builder.yml`](../electron-builder.yml). The build pipeline is:

```text
npm run build      → out/ (renderer + main + preload bundled)
electron-builder   → release/ (DMG / NSIS / AppImage / zip)
```

## Scripts

From [`package.json`](../package.json):

| Script               | What it does                                                                     |
| -------------------- | -------------------------------------------------------------------------------- |
| `npm run build`      | electron-vite produces main + preload + renderer into `out/`                     |
| `npm run pack`       | Build + electron-builder `--dir` (unpacked app at `release/<platform>-unpacked`) |
| `npm run dist`       | Build + full installer for the host platform                                     |
| `npm run dist:mac`   | DMG + ZIP for macOS (both arm64 + x64)                                           |
| `npm run dist:win`   | NSIS installer for Windows (x64)                                                 |
| `npm run dist:linux` | AppImage + deb for Linux (x64)                                                   |

All platform-specific builds run through electron-builder. You can cross-build Linux from macOS, but **macOS DMGs must be built on macOS** (codesign binary) and **Windows installers need a Windows host** (or signtool under mono — painful; just use Windows).

## Config walkthrough

Key sections of [`electron-builder.yml`](../electron-builder.yml):

```yaml
appId: io.prepos.app
productName: PrepOS
copyright: Copyright © 2026 PrepOS
directories:
  output: release
  buildResources: build
files:
  - "out/**"
  - "package.json"
  - "!**/*.map"
```

- `appId` is the bundle ID used everywhere (CFBundleIdentifier on macOS, AUMID on Windows). Change cautiously — it's the identity the OS uses to de-duplicate installs.
- `directories.output: release` means all artifacts land in `release/`.
- `directories.buildResources: build` is where icons + entitlements live.
- `files` lists what gets packed. We intentionally exclude sourcemaps from shipped builds.

### macOS

```yaml
mac:
  category: public.app-category.developer-tools
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  target:
    - target: dmg
      arch: [arm64, x64]
    - target: zip
      arch: [arm64, x64]
  notarize: false
```

- `hardenedRuntime: true` is required for notarization (once we enable it).
- [`build/entitlements.mac.plist`](../build/entitlements.mac.plist) grants the sandboxed runtime the right to:
  - JIT + unsigned memory (V8 + Chromium)
  - User-selected files (open dialogs)
  - Device: camera, audio-input (for future voice features)
  - Network client (API calls to OpenAI/Anthropic)
- `notarize: false` until we have an Apple Developer ID + app-specific password; change to `notarize: true` and set the env vars below when you're ready to ship publicly.

### Windows

```yaml
win:
  icon: build/icon.ico
  target:
    - target: nsis
      arch: [x64]
```

NSIS installer. One-click, per-user install, no admin required. `build/icon.ico` is the multi-size icon used for the exe and shortcuts.

### Linux

```yaml
linux:
  icon: build/icons
  category: Development
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
```

AppImage is a single portable file. `deb` is for Debian/Ubuntu via `apt install ./prep-os.deb`. Supply a folder of PNGs under `build/icons/` at standard sizes (16, 32, 64, 128, 256, 512) for the `.desktop` entry.

### Publish

```yaml
publish:
  provider: github
  owner: your-gh-org
  repo: prep-os
```

When electron-builder detects a `GH_TOKEN` env var and `publish: always`, it uploads artifacts to a GitHub release matching `package.json` `version`. Our `dist:*` scripts don't publish by default; pass `-p always` or set `publish: always` in the YAML when cutting a real release.

## Required assets

Create these under `build/` (files you'll want to source / commission):

| Path                           | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `build/icon.icns`              | macOS app icon                                   |
| `build/icon.ico`               | Windows icon                                     |
| `build/icons/*.png`            | Linux icon set (16, 32, 64, 128, 256, 512)       |
| `build/background.png`         | DMG background image (optional; default is fine) |
| `build/entitlements.mac.plist` | Already checked in                               |

If you don't have icons yet, `electron-builder` will complain on DMG builds. Supply at least a 1024×1024 PNG and use a tool (e.g., `iconutil`, `png2icons`) to generate `.icns` + `.ico`.

## Code signing

### macOS

To sign + notarize, set these env vars before running `npm run dist:mac`:

```bash
export CSC_LINK="<base64 of .p12 or path>"       # Developer ID Application cert
export CSC_KEY_PASSWORD="<password>"
export APPLE_ID="<your apple id email>"
export APPLE_APP_SPECIFIC_PASSWORD="<app-specific pw>"
export APPLE_TEAM_ID="<10-char team id>"
```

Then flip `notarize: true` in `electron-builder.yml`. electron-builder will:

1. Sign each binary in the `.app` with your Developer ID cert.
2. Package into DMG + ZIP.
3. Upload the DMG to Apple's notarization service.
4. Staple the ticket on success.

Without these vars, builds are unsigned — they'll run locally (with the Gatekeeper "downloaded from internet" dialog + right-click → Open workaround) but aren't distributable.

### Windows

Set:

```bash
export CSC_LINK="path/to/cert.pfx"
export CSC_KEY_PASSWORD="password"
```

electron-builder will sign the NSIS installer + executables. Without signing, Windows SmartScreen will show a red warning.

### Linux

No signing required. AppImages can be signed with GPG via `gpgPath` in the YAML; rarely needed.

## Auto-updates

[`src/main/index.ts#setupAutoUpdate`](../src/main/index.ts) dynamically imports `electron-updater` and calls `autoUpdater.checkForUpdatesAndNotify()` — only in packaged builds (`app.isPackaged`).

For it to work in the wild:

1. The `publish` section in `electron-builder.yml` must point at where your updates live (GitHub Releases, S3, etc.).
2. The host must serve the `latest-mac.yml` / `latest.yml` / `latest-linux.yml` files electron-builder produces.
3. The running app must match the publish target (same appId, same provider).

When an update is available, it downloads in background and applies on next relaunch by default. You can wire custom dialogs by listening to `update-downloaded` / `update-available` events on the `autoUpdater` object (not currently wired — see the dynamic import block for the place to add them).

## Release workflow (recommended)

1. Bump `version` in `package.json`.
2. Update a changelog (not yet set up in-repo).
3. `npm run typecheck` + `npm run build` locally.
4. `npm run dist:mac` on a Mac, `npm run dist:win` on Windows.
5. Test the installed artifacts locally (install from DMG, launch, ensure capture + AI work).
6. Tag `vX.Y.Z`, push, attach artifacts to the GitHub release.
7. Users with older versions auto-update on next launch.
