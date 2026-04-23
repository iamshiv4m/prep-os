import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { useShell } from "../store/shell";
import PluginIcon from "./PluginIcon";

const ICON_PRESETS = [
  "🌐",
  "⚡",
  "🔥",
  "🚀",
  "💡",
  "🧠",
  "🧩",
  "🛠️",
  "📚",
  "📖",
  "📝",
  "🎨",
  "🎯",
  "💻",
  "⌨️",
  "🖥️",
  "🧪",
  "🔬",
  "🔎",
  "📊",
  "📈",
  "🗂️",
  "💬",
  "📬",
  "📺",
  "🎧",
  "🎬",
  "🏆",
  "🎖️",
  "✨",
  "🌙",
  "☀️",
  "🧰",
  "🪄",
  "🦄",
  "🐙",
];

function deriveFavicon(url: string): string | null {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const host = new URL(normalized).hostname;
    if (!host) return null;
    // Google S2 is safe, cached and always renders even without the site reachable.
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

export default function Launchpad() {
  const open = useShell((s) => s.launchpadOpen);
  const setOpen = useShell((s) => s.setLaunchpad);
  const plugins = usePlugins((s) => s.plugins);
  const refresh = usePlugins((s) => s.refresh);
  const removePlugin = usePlugins((s) => s.remove);
  const addCustom = usePlugins((s) => s.addCustom);
  const openApp = useWindows((s) => s.openApp);

  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("🌐");
  const [useFavicon, setUseFavicon] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setAddOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!addOpen) {
      setName("");
      setUrl("");
      setIcon("🌐");
      setUseFavicon(false);
    }
  }, [addOpen]);

  const favicon = useMemo(() => (url ? deriveFavicon(url) : null), [url]);
  const effectiveIcon = useFavicon && favicon ? favicon : icon;

  const filtered = plugins.filter(
    (p) => !p.hidden && p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    await addCustom({ name: name.trim(), url: normalized, icon: effectiveIcon });
    setAddOpen(false);
    await refresh();
  };

  const handleOpen = (id: string) => {
    const plugin = plugins.find((p) => p.id === id);
    if (!plugin) return;
    openApp(plugin);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[8500] flex flex-col items-center pt-16 backdrop-blur-2xl"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-5xl flex-col items-center"
          >
            <div className="mb-6 flex w-full max-w-md items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-xl">
              <Search className="h-4 w-4 text-white/60" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps"
                className="flex-1 bg-transparent outline-none placeholder:text-white/50"
              />
              <button
                onClick={() => setAddOpen((v) => !v)}
                className="flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/20"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>

            {addOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex w-full max-w-md flex-col gap-3 rounded-xl border border-white/15 bg-neutral-950/70 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-[28px]">
                    {useFavicon && favicon ? (
                      <img
                        src={favicon}
                        alt="favicon"
                        className="h-[72%] w-[72%] rounded-md object-contain"
                      />
                    ) : (
                      <span className="leading-none">{icon}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="App name"
                      className="h-9 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
                    />
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="h-9 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/55">
                  <span className="font-medium uppercase tracking-wider">Icon</span>
                  <button
                    onClick={() => favicon && setUseFavicon((v) => !v)}
                    disabled={!favicon}
                    className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-0.5 text-[10.5px] text-white/70 hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    title={favicon ? "Use site favicon" : "Enter a URL first"}
                  >
                    <Sparkles className="h-3 w-3" />
                    {useFavicon ? "Using favicon" : "Auto-favicon"}
                  </button>
                </div>

                <div className="grid grid-cols-9 gap-1 rounded-lg border border-white/10 bg-black/30 p-2">
                  {ICON_PRESETS.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setIcon(e);
                        setUseFavicon(false);
                      }}
                      className={
                        icon === e && !useFavicon
                          ? "flex h-7 w-7 items-center justify-center rounded-md bg-white/20 text-[16px] ring-1 ring-white/30"
                          : "flex h-7 w-7 items-center justify-center rounded-md text-[16px] hover:bg-white/10"
                      }
                      aria-label={`Use ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setAddOpen(false)}
                    className="rounded-md px-3 py-1 text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!name.trim() || !url.trim()}
                    className="rounded-md bg-blue-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add app
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid w-full max-w-5xl grid-cols-5 gap-x-4 gap-y-8 px-12 md:grid-cols-6 lg:grid-cols-7">
              {filtered.map((p) => (
                <div key={p.id} className="group relative flex flex-col items-center">
                  <button
                    onClick={() => handleOpen(p.id)}
                    className="transition-transform hover:-translate-y-0.5 hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <PluginIcon plugin={p} size={80} />
                  </button>
                  <span className="mt-2 max-w-[90px] truncate text-center text-[12px] text-white/85">
                    {p.name}
                  </span>
                  {!p.builtIn && (
                    <button
                      onClick={() => removePlugin(p.id)}
                      className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/80 hover:text-red-300 group-hover:flex"
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-sm text-white/50">
                  No apps match &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </motion.div>
          <button
            onClick={() => setOpen(false)}
            className="fixed right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
