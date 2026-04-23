import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlugins } from "../store/plugins";
import { useWindows, type WindowState } from "../store/windows";
import clsx from "../utils/clsx";
import PluginIcon from "./PluginIcon";

/**
 * macOS-style ⌘Tab application switcher. Lists all open windows (including
 * minimized) and lets the user cycle with Tab while holding Cmd/Ctrl. Release
 * to focus the selected window.
 */
export default function AppSwitcher() {
  const focusWindow = useWindows((s) => s.focusWindow);
  const restoreWindow = useWindows((s) => s.restoreWindow);
  const plugins = usePlugins((s) => s.plugins);

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const orderedRef = useRef<WindowState[]>([]);

  /**
   * Compute switch order: most recently focused first (highest zIndex),
   * minimized at the end. We snapshot this when the switcher opens so arrows
   * map to a stable list during the modal keypresses.
   */
  const buildOrder = useCallback((): WindowState[] => {
    const snap = useWindows.getState().windows;
    return [...snap].sort((a, b) => {
      if (a.minimized !== b.minimized) return a.minimized ? 1 : -1;
      return b.zIndex - a.zIndex;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Open or advance the switcher on Cmd/Ctrl+Tab
      if (mod && e.key === "Tab") {
        e.preventDefault();
        if (!open) {
          const list = buildOrder();
          if (list.length === 0) return;
          orderedRef.current = list;
          setIndex(e.shiftKey ? Math.max(0, list.length - 1) : Math.min(1, list.length - 1));
          setOpen(true);
        } else {
          const list = orderedRef.current;
          if (list.length === 0) return;
          setIndex((i) =>
            e.shiftKey ? (i - 1 + list.length) % list.length : (i + 1) % list.length,
          );
        }
        return;
      }

      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % Math.max(1, orderedRef.current.length));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const n = Math.max(1, orderedRef.current.length);
        setIndex((i) => (i - 1 + n) % n);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!open) return;
      // Releasing Meta/Control commits the selection (macOS feel)
      if (e.key === "Meta" || e.key === "Control") {
        e.preventDefault();
        commit();
      }
    };

    const commit = () => {
      const list = orderedRef.current;
      const target = list[index];
      if (target) {
        if (target.minimized) restoreWindow(target.id);
        else focusWindow(target.id);
      }
      setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [open, index, buildOrder, focusWindow, restoreWindow]);

  // Items are snapshotted when the switcher opens (ref-based) so arrow keys
  // map to a stable ordering during the gesture, even if a window closes mid-switch.
  const items = useMemo(() => {
    if (!open) return [];
    return orderedRef.current;
  }, [open]);

  // Keep index valid if windows changed while the switcher is open
  useEffect(() => {
    if (!open) return;
    if (index >= items.length) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index, open]);

  const plugin = (id: string) => plugins.find((p) => p.id === id);

  return (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="pointer-events-none fixed inset-0 z-[9700] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 6, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 4, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto relative flex max-w-[92vw] flex-col items-center gap-3 rounded-2xl border border-white/15 bg-neutral-900/85 px-4 py-4 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            <div className="flex items-end gap-3 overflow-x-auto">
              {items.map((w, i) => {
                const p = plugin(w.pluginId);
                const active = i === index;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setIndex(i);
                      if (w.minimized) restoreWindow(w.id);
                      else focusWindow(w.id);
                      setOpen(false);
                    }}
                    className={clsx(
                      "flex w-[92px] flex-col items-center gap-1.5 rounded-xl p-2 transition-colors",
                      active && "bg-white/10",
                    )}
                  >
                    <div
                      className={clsx(
                        "transition-transform",
                        active && "-translate-y-0.5 scale-[1.08]",
                      )}
                    >
                      <PluginIcon plugin={p} fallbackIcon={w.icon} alt={w.title} size={64} />
                    </div>
                    <span
                      className={clsx(
                        "max-w-full truncate text-[11px]",
                        active ? "text-white" : "text-white/65",
                      )}
                    >
                      {w.title}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/55">
              <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px]">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px]">
                Tab
              </kbd>
              <span>cycle · release to open · Esc to cancel</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
