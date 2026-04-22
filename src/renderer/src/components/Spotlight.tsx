import { AnimatePresence, motion } from "framer-motion";
import { Camera, Search, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlugins } from "../store/plugins";
import { useShell } from "../store/shell";
import { useWindows } from "../store/windows";

interface Command {
  id: string;
  title: string;
  hint?: string;
  iconNode?: React.ReactNode;
  emoji?: string;
  run: () => void;
}

export default function Spotlight() {
  const open = useShell((s) => s.spotlightOpen);
  const setOpen = useShell((s) => s.setSpotlight);
  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  const commands: Command[] = useMemo(() => {
    const base: Command[] = plugins
      .filter((p) => !p.hidden)
      .map((p) => ({
        id: `app:${p.id}`,
        title: p.name,
        hint: p.description ?? (p.type === "webview" ? p.entry : "Native app"),
        emoji: p.icon,
        run: () => {
          openApp(p);
          setOpen(false);
        },
      }));

    base.push({
      id: "action:capture",
      title: "Capture region + ask AI",
      hint: "Screenshot a part of your screen and send to AI",
      iconNode: <Camera className="h-4 w-4" />,
      run: async () => {
        setOpen(false);
        const capture = await window.prepOS.captures.trigger();
        void capture;
      },
    });

    base.push({
      id: "action:settings",
      title: "Open Settings",
      hint: "Change API keys and preferences",
      iconNode: <SettingsIcon className="h-4 w-4" />,
      run: () => {
        const settings = plugins.find((p) => p.id === "settings");
        if (settings) openApp(settings);
        setOpen(false);
      },
    });

    base.push({
      id: "action:new-chat",
      title: "New AI chat",
      hint: "Start a fresh chat with the AI assistant",
      iconNode: <Sparkles className="h-4 w-4" />,
      run: () => {
        const chat = plugins.find((p) => p.id === "ai-chat");
        if (chat) openApp(chat);
        setOpen(false);
      },
    });

    return base;
  }, [plugins, openApp, setOpen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    if (cursor >= filtered.length) setCursor(Math.max(0, filtered.length - 1));
  }, [filtered.length, cursor]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[cursor]?.run();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9500] flex items-start justify-center pt-24"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[580px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/15 bg-neutral-900/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="h-5 w-5 text-white/60" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Spotlight · search apps, ask AI, commands…"
                className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/45"
              />
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                esc
              </span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-white/50">No matches</div>
              )}
              {filtered.map((c, i) => (
                <button
                  key={c.id}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => c.run()}
                  className={
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm " +
                    (i === cursor ? "bg-white/10" : "hover:bg-white/5")
                  }
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-base">
                    {c.iconNode ?? c.emoji}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-white/90">{c.title}</span>
                    {c.hint && <span className="text-[11px] text-white/50">{c.hint}</span>}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
