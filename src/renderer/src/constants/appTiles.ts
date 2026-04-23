import {
  Atom,
  BookOpen,
  FlaskConical,
  Github,
  Newspaper,
  NotebookPen,
  PenLine,
  Puzzle,
  Settings,
  Sparkles,
  Terminal,
  Youtube,
  type LucideIcon,
} from "lucide-react";

export interface AppTile {
  /** Tailwind gradient spec: "from-X to-Y" (used inside `bg-gradient-to-br`). */
  gradient: string;
  /** Lucide icon rendered on top of the gradient. */
  Icon: LucideIcon;
  /** Strength of the icon glyph — some need thicker strokes to read small. */
  stroke?: number;
}

/**
 * Consistent app-tile treatment for built-in plugins.
 * User-added webviews fall back to their emoji/image icon.
 */
export const APP_TILES: Record<string, AppTile> = {
  "devtools-tech": { gradient: "from-sky-400 to-indigo-600", Icon: Atom, stroke: 2 },
  leetcode: { gradient: "from-amber-400 to-orange-600", Icon: Puzzle, stroke: 2.2 },
  hackerrank: { gradient: "from-emerald-400 to-green-600", Icon: Terminal, stroke: 2.2 },
  github: { gradient: "from-neutral-600 to-neutral-900", Icon: Github, stroke: 2 },
  excalidraw: { gradient: "from-violet-400 to-purple-600", Icon: PenLine, stroke: 2.2 },
  "youtube-prep": { gradient: "from-rose-400 to-red-600", Icon: Youtube, stroke: 2 },
  feed: { gradient: "from-amber-500 to-orange-700", Icon: Newspaper, stroke: 2 },
  "ai-chat": { gradient: "from-fuchsia-400 to-pink-600", Icon: Sparkles, stroke: 2.2 },
  notes: { gradient: "from-yellow-300 to-amber-500", Icon: NotebookPen, stroke: 2.2 },
  playground: { gradient: "from-teal-400 to-cyan-600", Icon: FlaskConical, stroke: 2.2 },
  settings: { gradient: "from-slate-400 to-slate-700", Icon: Settings, stroke: 2 },
  reader: { gradient: "from-sky-400 to-blue-600", Icon: BookOpen, stroke: 2 },
};

export function hasAppTile(id: string): boolean {
  return id in APP_TILES;
}
