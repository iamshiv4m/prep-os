export type AIProvider = "openai" | "anthropic";

export interface AppSettings {
  aiProvider: AIProvider;
  openaiModel: string;
  anthropicModel: string;
  theme: "system" | "light" | "dark";
  wallpaper: string;
  captureShortcut: string;
  spotlightShortcut: string;
  /** When true + focus is active, quitting the app shows a confirmation dialog. */
  focusHardLock: boolean;
}

export interface PluginSection {
  id: string;
  label: string;
  icon?: string;
  url: string;
  /** When true, this section matches any URL starting with `url`. Default: false (exact match). */
  matchPrefix?: boolean;
}

export interface PluginManifest {
  id: string;
  name: string;
  icon: string;
  version: string;
  type: "webview" | "native";
  entry: string;
  window?: {
    defaultSize: { w: number; h: number };
    minSize?: { w: number; h: number };
    resizable?: boolean;
  };
  permissions?: ("storage" | "network" | "capture" | "ai")[];
  author?: string;
  injectCSS?: string;
  homepageShortcut?: string;
  description?: string;
  builtIn?: boolean;
  /** Hide from Dock / Launchpad / Spotlight. Used for transient apps (e.g. Reader). */
  hidden?: boolean;
  /** Optional list of in-app shortcuts rendered as a macOS sidebar inside the webview window. */
  sections?: PluginSection[];
}

export interface Capture {
  id: string;
  path: string;
  dataUrl: string;
  createdAt: number;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  imagePath?: string;
  imageDataUrl?: string;
  createdAt: number;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  linkedCaptureIds?: string[];
}

export interface FocusSession {
  id: string;
  pluginId: string;
  pluginName: string;
  pluginIcon?: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
}

export type TipCategory =
  | "behavioral"
  | "coding"
  | "system-design"
  | "frontend"
  | "backend"
  | "career"
  | "mindset";

export interface Tip {
  id: string;
  category: TipCategory;
  title: string;
  body: string;
  /** Optional link to read more (opens in external browser). */
  link?: string;
}

export type FeedCategory = "career" | "frontend" | "backend" | "system-design" | "general";

export interface FeedSource {
  id: string;
  name: string;
  icon: string;
  /** Base site URL for display only. */
  homepage: string;
  /** RSS/Atom feed URL. */
  rss: string;
  /** Used to accent source labels in the UI. */
  color?: string;
  /** Grouping for the Dev News sidebar. */
  category?: FeedCategory;
}

export interface FeedItem {
  id: string;
  sourceId: string;
  title: string;
  url: string;
  description?: string;
  author?: string;
  publishedAt: number;
}

export interface FeedSnapshot {
  items: FeedItem[];
  updatedAt: number;
  errors: Array<{ sourceId: string; message: string }>;
}

export type ContestPlatform = "leetcode" | "codeforces";

export interface ContestItem {
  id: string;
  platform: ContestPlatform;
  name: string;
  url: string;
  /** UTC ms timestamp when contest starts. */
  startsAt: number;
  /** Duration in milliseconds. */
  durationMs: number;
  /** Original payload from the upstream API, retained for debugging. */
  raw?: unknown;
}

export interface ContestSnapshot {
  items: ContestItem[];
  updatedAt: number;
  errors: Array<{ platform: string; message: string }>;
}

export interface AIChatRequest {
  sessionId: string;
  provider: AIProvider;
  model: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    imageDataUrl?: string;
  }>;
}

export interface AIChatResponse {
  content: string;
  error?: string;
}

export type UpdateCheckResult =
  | { status: "dev" }
  | { status: "up-to-date"; current: string }
  | {
      status: "available";
      current: string;
      latest: string;
      url: string;
      notes: string;
      publishedAt: string;
    }
  | { status: "error"; message: string };

/** Event payload pushed to renderer when the boot-time check finds a release newer than the installed version. */
export type UpdateAvailablePayload = Extract<UpdateCheckResult, { status: "available" }>;

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
  quit: () => Promise<void>;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  /** Subscribe to startup-time update discovery. Returns an unsubscribe fn. */
  onUpdateAvailable: (cb: (payload: UpdateAvailablePayload) => void) => () => void;
  windowControls: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (patch: Partial<AppSettings>) => Promise<AppSettings>;
    getApiKey: (provider: AIProvider) => Promise<string | null>;
    setApiKey: (provider: AIProvider, value: string) => Promise<void>;
  };
  plugins: {
    list: () => Promise<PluginManifest[]>;
    add: (manifest: Partial<PluginManifest>) => Promise<PluginManifest>;
    remove: (id: string) => Promise<void>;
  };
  captures: {
    trigger: () => Promise<Capture | null>;
    list: () => Promise<Capture[]>;
    remove: (id: string) => Promise<void>;
    onReady: (cb: (capture: Capture) => void) => () => void;
  };
  capture: {
    commitRegion: (region: {
      x: number;
      y: number;
      width: number;
      height: number;
      displayId: number;
    }) => Promise<Capture | null>;
    cancelRegion: () => Promise<void>;
  };
  ai: {
    chat: (req: AIChatRequest) => Promise<AIChatResponse>;
  };
  chat: {
    listSessions: () => Promise<ChatSession[]>;
    saveSession: (session: ChatSession) => Promise<void>;
    removeSession: (id: string) => Promise<void>;
  };
  notes: {
    list: () => Promise<Note[]>;
    save: (note: Note) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
  focus: {
    list: () => Promise<FocusSession[]>;
    append: (session: FocusSession) => Promise<void>;
    clear: () => Promise<void>;
    setGuard: (active: boolean) => Promise<void>;
  };
  tips: {
    today: () => Promise<Tip>;
    all: () => Promise<Tip[]>;
  };
  feed: {
    sources: () => Promise<FeedSource[]>;
    list: () => Promise<FeedSnapshot>;
    refresh: () => Promise<FeedSnapshot>;
  };
  contests: {
    list: () => Promise<ContestSnapshot>;
    refresh: () => Promise<ContestSnapshot>;
  };
  openExternal: (url: string) => Promise<void>;
  onOpenUrl: (cb: (url: string) => void) => () => void;
  lockdown: {
    enable: () => Promise<boolean>;
    disable: () => Promise<boolean>;
    state: () => Promise<boolean>;
    onChange: (cb: (active: boolean) => void) => () => void;
  };
}
