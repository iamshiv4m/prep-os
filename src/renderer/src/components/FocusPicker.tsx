import { AnimatePresence, motion } from "framer-motion";
import { Search, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFocus } from "../store/focus";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";

export default function FocusPicker() {
  const open = useFocus((s) => s.pickerOpen);
  const closePicker = useFocus((s) => s.closePicker);
  const start = useFocus((s) => s.start);
  const plugins = usePlugins((s) => s.plugins);
  const windows = useWindows((s) => s.windows);
  const openApp = useWindows((s) => s.openApp);
  const focusWindow = useWindows((s) => s.focusWindow);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePicker();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePicker]);

  const filtered = plugins.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const handlePick = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (!plugin) return;
    const existing = windows.find((w) => w.pluginId === plugin.id);
    if (existing) {
      focusWindow(existing.id);
    } else {
      openApp(plugin);
    }
    start(plugin);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9300] flex flex-col items-center pt-20 backdrop-blur-2xl"
          style={{ background: "rgba(5,10,20,0.55)" }}
          onClick={closePicker}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-5xl flex-col items-center px-8"
          >
            <div className="mb-4 flex items-center gap-2 text-white/80">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium tracking-wide">
                Which app do you want to focus on?
              </span>
            </div>
            <p className="mb-6 max-w-lg text-center text-xs text-white/50">
              Pick an app to start a focus session. Switching to a different app will end the
              session automatically.
            </p>

            <div className="mb-8 flex w-full max-w-md items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-xl">
              <Search className="h-4 w-4 text-white/60" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps"
                className="flex-1 bg-transparent outline-none placeholder:text-white/50"
              />
            </div>

            <div className="grid w-full grid-cols-5 gap-x-4 gap-y-8 md:grid-cols-6 lg:grid-cols-7">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePick(p.id)}
                  className="group flex flex-col items-center gap-2 outline-none"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[40px] shadow-inner shadow-black/30 backdrop-blur-md transition-transform group-hover:scale-105 group-hover:border-emerald-400/40 group-hover:bg-emerald-500/15 group-focus-visible:border-emerald-400/60">
                    {p.icon.startsWith("http") || p.icon.startsWith("data:") ? (
                      <img
                        src={p.icon}
                        alt={p.name}
                        className="h-[70%] w-[70%] rounded-xl object-cover"
                      />
                    ) : (
                      <span>{p.icon}</span>
                    )}
                  </span>
                  <span className="max-w-[90px] truncate text-center text-[12px] text-white/85">
                    {p.name}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center text-sm text-white/50">
                  No apps match &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </motion.div>
          <button
            onClick={closePicker}
            className="fixed right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 hover:bg-white/20"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
