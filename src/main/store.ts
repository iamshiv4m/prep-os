import { safeStorage } from "electron";
import Store from "electron-store";
import type {
  AIProvider,
  AppSettings,
  Capture,
  ChatSession,
  ContestSnapshot,
  FeedSnapshot,
  FocusSession,
  Note,
  PluginManifest,
} from "@shared/types";

interface PersistedShape {
  settings: AppSettings;
  encryptedKeys: Record<AIProvider, string | null>;
  userPlugins: PluginManifest[];
  captures: Capture[];
  chatSessions: ChatSession[];
  notes: Note[];
  focusSessions: FocusSession[];
  feedCache: FeedSnapshot | null;
  contestsCache: ContestSnapshot | null;
}

const defaultSettings: AppSettings = {
  aiProvider: "openai",
  openaiModel: "gpt-4o-mini",
  anthropicModel: "claude-3-5-sonnet-latest",
  theme: "system",
  wallpaper: "default",
  captureShortcut: "CommandOrControl+Shift+A",
  spotlightShortcut: "CommandOrControl+K",
  focusHardLock: false,
};

const store = new Store<PersistedShape>({
  name: "prep-os",
  defaults: {
    settings: defaultSettings,
    encryptedKeys: { openai: null, anthropic: null },
    userPlugins: [],
    captures: [],
    chatSessions: [],
    notes: [],
    focusSessions: [],
    feedCache: null,
    contestsCache: null,
  },
});

export function getSettings(): AppSettings {
  return { ...defaultSettings, ...store.get("settings") };
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch };
  store.set("settings", next);
  return next;
}

export function getApiKey(provider: AIProvider): string | null {
  const encryptedKeys = store.get("encryptedKeys") ?? { openai: null, anthropic: null };
  const encoded = encryptedKeys[provider];
  if (!encoded) return null;
  try {
    if (!safeStorage.isEncryptionAvailable()) return encoded;
    return safeStorage.decryptString(Buffer.from(encoded, "base64"));
  } catch {
    return null;
  }
}

export function setApiKey(provider: AIProvider, value: string): void {
  const encryptedKeys = store.get("encryptedKeys") ?? { openai: null, anthropic: null };
  if (!value) {
    encryptedKeys[provider] = null;
  } else if (safeStorage.isEncryptionAvailable()) {
    encryptedKeys[provider] = safeStorage.encryptString(value).toString("base64");
  } else {
    encryptedKeys[provider] = value;
  }
  store.set("encryptedKeys", encryptedKeys);
}

export function getUserPlugins(): PluginManifest[] {
  return store.get("userPlugins") ?? [];
}

export function setUserPlugins(next: PluginManifest[]): void {
  store.set("userPlugins", next);
}

export function getCaptures(): Capture[] {
  return store.get("captures") ?? [];
}

export function setCaptures(next: Capture[]): void {
  store.set("captures", next);
}

export function getChatSessions(): ChatSession[] {
  return store.get("chatSessions") ?? [];
}

export function setChatSessions(next: ChatSession[]): void {
  store.set("chatSessions", next);
}

export function getNotes(): Note[] {
  return store.get("notes") ?? [];
}

export function setNotes(next: Note[]): void {
  store.set("notes", next);
}

const FOCUS_SESSIONS_CAP = 1000;

export function getFocusSessions(): FocusSession[] {
  return store.get("focusSessions") ?? [];
}

export function appendFocusSession(session: FocusSession): void {
  const list = getFocusSessions();
  const next = [session, ...list.filter((s) => s.id !== session.id)].slice(0, FOCUS_SESSIONS_CAP);
  store.set("focusSessions", next);
}

export function clearFocusSessions(): void {
  store.set("focusSessions", []);
}

export function getFeedCache(): FeedSnapshot | null {
  return store.get("feedCache") ?? null;
}

export function setFeedCache(snapshot: FeedSnapshot): void {
  store.set("feedCache", snapshot);
}

export function getContestsCache(): ContestSnapshot | null {
  return store.get("contestsCache") ?? null;
}

export function setContestsCache(snapshot: ContestSnapshot): void {
  store.set("contestsCache", snapshot);
}
