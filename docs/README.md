# PrepOS — documentation

Welcome. This folder is the source of truth for how PrepOS works internally.

If you're an **AI coding agent**, start at [`../AGENTS.md`](../AGENTS.md) first, then come back here.

If you're a **human developer** joining the project, read top-to-bottom in this order:

1. [getting-started.md](getting-started.md) — clone, install, run, build
2. [architecture.md](architecture.md) — the 10,000-foot view + diagrams
3. [main-process.md](main-process.md) — every file in `src/main/`
4. [renderer.md](renderer.md) — UI components, Zustand stores, styling
5. [ipc-reference.md](ipc-reference.md) — the exact contract between main and renderer
6. [plugins.md](plugins.md) — plugin manifest schema + how to add one
7. [capture-and-ai.md](capture-and-ai.md) — the signature capture → AI flow end-to-end
8. [build-and-release.md](build-and-release.md) — packaging for macOS / Windows / Linux
9. [troubleshooting.md](troubleshooting.md) — common issues and fixes

## Conventions followed in the docs

- File paths are clickable — every `src/...` reference is a link.
- Line-specific references use GitHub-style anchors where relevant.
- Hindi/Hinglish notes are used sparingly, only where the author wanted to call something out casually. All canonical content is in English.
- Mermaid diagrams render on GitHub and in most IDEs (Cursor, VS Code).

## Quick glossary

| Term        | Meaning in this project                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| **Shell**   | The OS-like renderer UI: desktop + dock + menubar + window manager              |
| **Plugin**  | A "dockable app" — either a `native` React component or a `webview` URL         |
| **Window**  | One React-rendered window instance tracked in the Zustand window store          |
| **Capture** | A PNG screenshot of a screen region saved to `userData/captures/`               |
| **Session** | An AI chat conversation (list of messages + metadata), persisted locally        |
| **Preload** | Electron bridge script that exposes a typed, limited API to the renderer        |
| **IPC**     | Inter-process communication — main ↔ renderer, only via preload-exposed methods |

## Not covered yet

Things that exist in code but don't have dedicated docs (contributions welcome):

- Custom wallpaper uploads
- Drag-and-drop images into AI Chat
- System tray menu customization beyond defaults
- Native Windows / Linux capture overlays (currently only tested on macOS)
