import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { useShell } from "../store/shell";

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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = plugins.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    await addCustom({ name: name.trim(), url: normalized, icon });
    setName("");
    setUrl("");
    setIcon("🌐");
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
              <div className="mb-6 flex w-full max-w-md flex-col gap-2 rounded-xl border border-white/15 bg-black/40 p-3 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                    maxLength={2}
                    className="h-9 w-12 rounded-md border border-white/15 bg-white/5 text-center text-xl outline-none"
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="App name"
                    className="h-9 flex-1 rounded-md border border-white/15 bg-white/5 px-3 text-sm outline-none placeholder:text-white/40"
                  />
                </div>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-9 rounded-md border border-white/15 bg-white/5 px-3 text-sm outline-none placeholder:text-white/40"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setAddOpen(false)}
                    className="rounded-md px-3 py-1 text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    className="rounded-md bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-400"
                  >
                    Add app
                  </button>
                </div>
              </div>
            )}

            <div className="grid w-full max-w-5xl grid-cols-5 gap-x-4 gap-y-8 px-12 md:grid-cols-6 lg:grid-cols-7">
              {filtered.map((p) => (
                <div key={p.id} className="group relative flex flex-col items-center">
                  <button
                    onClick={() => handleOpen(p.id)}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-[40px] shadow-inner shadow-black/30 backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/15"
                  >
                    {p.icon.startsWith("http") || p.icon.startsWith("data:") ? (
                      <img
                        src={p.icon}
                        alt={p.name}
                        className="h-[70%] w-[70%] rounded-xl object-cover"
                      />
                    ) : (
                      <span>{p.icon}</span>
                    )}
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
