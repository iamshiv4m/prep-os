# Plugins

PrepOS ships with a small registry of "apps" the user can dock, search, and open. Every one of them is a **plugin** described by a JSON-serializable manifest. The registry lives in the main process ([`src/main/plugins.ts`](../src/main/plugins.ts)) so it survives restarts and shares one source of truth.

Two plugin types exist today:

- `native` — rendered by a React component we ship inside the renderer.
- `webview` — rendered by an `<electron-webview>` pointing at a public URL.

## Manifest schema

Defined in [`src/shared/types.ts`](../src/shared/types.ts). Every plugin must conform:

```ts
interface PluginManifest {
  id: string; // unique, e.g. "leetcode" or "user-mydocs-1729"
  name: string; // shown in dock + launchpad + titlebar
  description?: string; // shown in launchpad card
  icon?: string; // emoji, or path to image
  version?: string; // defaults to "1.0.0"
  type: "native" | "webview";
  entry: string; // for native: key known to AppRouter
  // for webview: initial URL
  window?: {
    defaultSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
    resizable?: boolean;
  };
  webview?: {
    partition?: string; // persist:<id> default
    preload?: string; // optional preload script path
    userAgent?: string;
    injectCSS?: string; // CSS to run via webview.insertCSS
  };
  builtIn?: boolean; // true for plugins hardcoded in main
  sections?: PluginSection[]; // optional macOS-style sidebar shortcuts (webview only)
}

interface PluginSection {
  id: string; // stable, unique within the plugin
  label: string; // shown in sidebar
  icon?: string; // emoji or symbol
  url: string; // navigated to when clicked
  matchPrefix?: boolean; // true = "active" when current URL starts with `url`
}
```

When `sections` is non-empty on a webview plugin, PrepOS renders a native-feel **left sidebar** inside that window (Finder / Mail style) and the currently active section is highlighted automatically. Users can toggle the sidebar with `⌘ \`. Keep the list short (4–8 entries) for a clean look.

## Built-in plugins

Hardcoded in [`src/main/plugins.ts`](../src/main/plugins.ts) under `BUILT_IN_PLUGINS`. Today:

| id           | name          | type    | entry                        |
| ------------ | ------------- | ------- | ---------------------------- |
| `ai-chat`    | AI Chat       | native  | `ai-chat`                    |
| `notes`      | Notes         | native  | `notes`                      |
| `playground` | Playground    | native  | `playground`                 |
| `settings`   | Settings      | native  | `settings`                   |
| `leetcode`   | LeetCode      | webview | `https://leetcode.com`       |
| `hackerrank` | HackerRank    | webview | `https://www.hackerrank.com` |
| `github`     | GitHub        | webview | `https://github.com`         |
| `excalidraw` | Excalidraw    | webview | `https://excalidraw.com`     |
| `youtube`    | YouTube       | webview | `https://www.youtube.com`    |
| `devtools`   | DevTools Tech | webview | `https://devtools.tech`      |

`builtIn: true` on each. The field is informational — the registry treats built-ins and user plugins the same, but the UI can use `builtIn` to decide whether to show a "Remove" affordance in launchpad.

## Adding a built-in plugin

1. Open [`src/main/plugins.ts`](../src/main/plugins.ts).
2. Append a new object to `BUILT_IN_PLUGINS`. Example:

   ```ts
   {
     id: 'codeforces',
     name: 'Codeforces',
     description: 'Competitive programming',
     icon: '⚔️',
     version: '1.0.0',
     type: 'webview',
     entry: 'https://codeforces.com',
     window: { defaultSize: { width: 1200, height: 780 } },
     builtIn: true,
   }
   ```

3. Restart `npm run dev`. It now appears in the dock + launchpad + spotlight.

If you want a **native** plugin instead:

1. Create `src/renderer/src/apps/Codeforces.tsx` exporting a default React component.
2. Register it in [`src/renderer/src/apps/AppRouter.tsx`](../src/renderer/src/apps/AppRouter.tsx):

   ```tsx
   case 'codeforces':
     return <Codeforces />
   ```

3. In the manifest set `type: 'native'` and `entry: 'codeforces'` (must match the switch case).

## User-added plugins

The renderer can ask main to persist an arbitrary manifest at runtime. Trigger it from Launchpad → **Add custom app**. Under the hood:

```ts
await window.prepOS.plugins.add({
  name: "ChatGPT",
  icon: "🤖",
  type: "webview",
  entry: "https://chat.openai.com",
});
await plugins.refresh();
```

Main generates an id (`user-<slug>-<timestamp>`), fills defaults (`version: '1.0.0'`, `window.defaultSize: 1100x760`, `webview.partition: persist:<id>`), writes it to the store, and returns. User plugins persist across restarts and appear alongside built-ins.

Removal:

```ts
await window.prepOS.plugins.remove(pluginId);
await plugins.refresh();
```

Built-ins can technically be removed by id from the store too, but they'll reappear on next start since they're hardcoded. In UI we hide the remove button for `builtIn: true`.

## Webview partitioning

Every webview plugin gets a `persist:<id>` partition so cookies / localStorage are isolated per plugin. LeetCode stays logged in even if you're also logged into GitHub in another window. Clearing a plugin's data = deleting `~/Library/Application Support/PrepOS/Partitions/<id>/` (macOS path).

## Security for user plugins

Only `http(s)` URLs are allowed. `shell.openExternal` guards against `file://`, `javascript:`, etc. The `<webview>` tag runs each site in its own sandboxed renderer with no Node access. We don't inject any preload into webview plugins today — if you start doing that (e.g., to hide ads or add shortcuts), use a dedicated, minimal preload and keep `contextIsolation: true`.

## Ideas for later

- Plugin marketplace (JSON index hosted on GitHub, import with one click)
- Hot-reload: detect store changes and update `plugins` Zustand store without a restart (currently works via `plugins.refresh()`, but no live push)
- Per-plugin keybindings (declared in the manifest)
- Custom native plugins via dynamic `import()` of a bundled `.js` — non-trivial because of the process boundary, but doable with a sandboxed plugin host

Any of those extend the same manifest; keep `src/shared/types.ts` in sync and the rest follows.
