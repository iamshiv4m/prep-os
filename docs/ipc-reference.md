# IPC reference

This is the exact contract between the renderer and the main process. Every channel listed here has three touchpoints:

- **Handler** — `ipcMain.handle` / `ipcMain.on` in [`src/main/ipc.ts`](../src/main/ipc.ts)
- **Bridge** — one line in [`src/main/preload.ts`](../src/main/preload.ts) that calls `ipcRenderer.invoke` / `.send`
- **Type** — a field on the `ElectronAPI` interface in [`src/shared/types.ts`](../src/shared/types.ts)

If you add a channel, touch all three in one change.

## Usage pattern

From the renderer:

```ts
const settings = await window.prepOS.settings.get();
await window.prepOS.settings.update({ theme: "dark" });
```

All async methods return a promise. One-way events (`capture:ready`) are delivered via subscription functions that return an unsubscribe callback.

## Surface

Grouped by namespace under `window.prepOS`.

### `app`

| Method              | Signature | Returns                                     |
| ------------------- | --------- | ------------------------------------------- |
| `app.getVersion()`  | —         | `Promise<string>` — from `app.getVersion()` |
| `app.getPlatform()` | —         | `Promise<'darwin' \| 'win32' \| 'linux'>`   |

### `window` (Electron window controls — for custom title bars)

| Method              | Signature | Returns                  |
| ------------------- | --------- | ------------------------ |
| `window.minimize()` | —         | `void` (fire-and-forget) |
| `window.maximize()` | —         | `void`                   |
| `window.close()`    | —         | `void`                   |

On macOS we keep the native traffic lights via `titleBarStyle: 'hiddenInset'`, so these are only used on Windows / Linux.

### `settings`

| Method                              | Signature                    | Returns                                     |
| ----------------------------------- | ---------------------------- | ------------------------------------------- |
| `settings.get()`                    | —                            | `Promise<AppSettings>`                      |
| `settings.update(partial)`          | `Partial<AppSettings>`       | `Promise<AppSettings>`                      |
| `settings.getApiKey(provider)`      | `'openai' \| 'anthropic'`    | `Promise<string \| null>` (decrypted)       |
| `settings.setApiKey(provider, key)` | `(provider, string \| null)` | `Promise<void>` (encrypted via safeStorage) |

### `plugins`

| Method                 | Signature                                         | Returns                                       |
| ---------------------- | ------------------------------------------------- | --------------------------------------------- |
| `plugins.list()`       | —                                                 | `Promise<PluginManifest[]>` (built-in ∪ user) |
| `plugins.add(partial)` | `Partial<PluginManifest> & { name, type, entry }` | `Promise<PluginManifest>`                     |
| `plugins.remove(id)`   | `string`                                          | `Promise<void>`                               |

### `capture`

| Method                         | Signature                            | Returns                                                               |
| ------------------------------ | ------------------------------------ | --------------------------------------------------------------------- |
| `capture.trigger()`            | —                                    | `Promise<Capture \| null>` — opens overlay, resolves on commit/cancel |
| `capture.list()`               | —                                    | `Promise<Capture[]>`                                                  |
| `capture.remove(id)`           | `string`                             | `Promise<void>` — also deletes PNG on disk                            |
| `capture.commitRegion(region)` | `{ x, y, width, height, displayId }` | `Promise<Capture>` — called by the overlay                            |
| `capture.cancelRegion()`       | —                                    | `void` — called by the overlay                                        |
| `captures.onReady(cb)`         | `(capture: Capture) => void`         | `() => void` — unsubscribe                                            |

### `ai`

| Method             | Signature       | Returns                   |
| ------------------ | --------------- | ------------------------- |
| `ai.chat(request)` | `AIChatRequest` | `Promise<AIChatResponse>` |

Shape:

```ts
AIChatRequest = {
  provider: 'openai' | 'anthropic'
  model: string
  systemPrompt?: string
  messages: ChatMessage[]
  maxTokens?: number
}

ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: { kind: 'capture'; id: string }[]
}

AIChatResponse = {
  role: 'assistant'
  content: string
  error?: string
}
```

### `chat` (session persistence)

| Method                      | Signature     | Returns                  |
| --------------------------- | ------------- | ------------------------ |
| `chat.listSessions()`       | —             | `Promise<ChatSession[]>` |
| `chat.saveSession(session)` | `ChatSession` | `Promise<ChatSession>`   |
| `chat.removeSession(id)`    | `string`      | `Promise<void>`          |

### `notes`

| Method             | Signature | Returns           |
| ------------------ | --------- | ----------------- |
| `notes.list()`     | —         | `Promise<Note[]>` |
| `notes.save(note)` | `Note`    | `Promise<Note>`   |
| `notes.remove(id)` | `string`  | `Promise<void>`   |

### `focus`

| Method                   | Signature      | Returns                   |
| ------------------------ | -------------- | ------------------------- |
| `focus.list()`           | —              | `Promise<FocusSession[]>` |
| `focus.append(session)`  | `FocusSession` | `Promise<void>`           |
| `focus.clear()`          | —              | `Promise<void>`           |
| `focus.setGuard(active)` | `boolean`      | `Promise<void>`           |

Main caps the list to the most recent 1000 sessions on `append`. Sessions are persisted inside the same `electron-store` JSON file under the `focusSessions` key.

`focus.setGuard(true)` tells the main process that the user is in a locked focus session. While that guard is set, the `before-quit` handler intercepts `Cmd+Q` / tray quit and shows a confirmation dialog. Calling `setGuard(false)` (or ending the session) releases the lock. See [`src/main/focus-guard.ts`](../src/main/focus-guard.ts).

Renderer-side the one-way event `focus:forceEnd` is fired from main when the user accepts "End Session & Quit" in the dialog — the preload exposes a subscription via `window.prepOSEvents.onFocusForceEnd(cb)`.

### `tips`

| Method         | Signature | Returns          |
| -------------- | --------- | ---------------- |
| `tips.today()` | —         | `Promise<Tip>`   |
| `tips.all()`   | —         | `Promise<Tip[]>` |

Deterministic daily pick. Data lives in [`src/shared/tips.ts`](../src/shared/tips.ts) — plain array, no remote fetch.

### `feed`

| Method           | Signature | Returns                 |
| ---------------- | --------- | ----------------------- |
| `feed.sources()` | —         | `Promise<FeedSource[]>` |
| `feed.list()`    | —         | `Promise<FeedSnapshot>` |
| `feed.refresh()` | —         | `Promise<FeedSnapshot>` |

`feed.list()` returns the in-memory cache if it's fresher than 20 min, otherwise refetches. `feed.refresh()` always refetches. See [`src/main/feed.ts`](../src/main/feed.ts) for the fetcher, RSS/Atom parser, and source list (HN, Dev.to, freeCodeCamp, Smashing, CSS-Tricks, GitHub Trending).

### `shell`

| Method                    | Signature | Returns                                    |
| ------------------------- | --------- | ------------------------------------------ |
| `shell.openExternal(url)` | `string`  | `Promise<void>` — only http/https accepted |

### Events (main → renderer)

Currently one:

- `capture:ready` — payload `Capture`. Subscribe via `window.prepOS.captures.onReady(cb)`; returns an unsubscribe function. Used by `App.tsx` to open a new AI Chat window seeded with the screenshot.

## Internals: how a handler is wired

Example — `settings.get`:

`src/shared/types.ts`:

```ts
interface ElectronAPI {
  settings: {
    get: () => Promise<AppSettings>;
    // ...
  };
  // ...
}
```

`src/main/preload.ts`:

```ts
const api: ElectronAPI = {
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    // ...
  },
  // ...
};
contextBridge.exposeInMainWorld("prepOS", api);
```

`src/main/ipc.ts`:

```ts
ipcMain.handle("settings:get", () => getSettings());
```

`src/main/store.ts`:

```ts
export function getSettings(): AppSettings {
  return store.get("settings");
}
```

Renderer:

```ts
const s = await window.prepOS.settings.get();
```

No string is repeated anywhere. If you change the channel name, TypeScript won't catch it — rg for the string across `src/main/ipc.ts` and `src/main/preload.ts` to keep them aligned.

## Adding a new channel — checklist

- [ ] Add the method signature to the right namespace in `ElectronAPI` (`src/shared/types.ts`)
- [ ] Add the `ipcRenderer.invoke(...)` or `.send(...)` wrapper in `src/main/preload.ts`
- [ ] Register `ipcMain.handle(...)` or `ipcMain.on(...)` in `src/main/ipc.ts`
- [ ] Implement the backing function in `src/main/<feature>.ts`
- [ ] If async and returns data, return from the handler; if fire-and-forget, use `.send` + `ipcMain.on`
- [ ] Run `npm run typecheck`
- [ ] Document it here

## Security notes

- Never expose `ipcRenderer` itself via `contextBridge` — always wrap each method. We do.
- Every handler in `ipc.ts` validates its input where needed (e.g., `shell.openExternal` rejects non-http schemes). Add validation when inputs can be user-crafted.
- Don't add a "dispatch anything" channel. Each capability gets its own named channel so permissions stay auditable.
