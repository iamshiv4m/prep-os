import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useEffect, useMemo } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  items: Array<{ keys: string[]; label: string }>;
}

function useIsMac(): boolean {
  return useMemo(() => {
    if (typeof navigator === "undefined") return true;
    return /mac|iphone|ipad/i.test(navigator.userAgent);
  }, []);
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md border border-white/15 bg-white/[0.08] px-1.5 text-[11px] font-semibold tabular-nums text-white/90 shadow-[inset_0_-1px_0_rgba(0,0,0,0.35)]">
      {children}
    </kbd>
  );
}

export default function ShortcutsOverlay({ open, onClose }: Props) {
  const isMac = useIsMac();
  const mod = isMac ? "⌘" : "Ctrl";
  const alt = isMac ? "⌥" : "Alt";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const groups: ShortcutGroup[] = useMemo(
    () => [
      {
        title: "Navigation",
        items: [
          { keys: [mod, "K"], label: "Open Spotlight search" },
          { keys: [mod, "L"], label: "Toggle Launchpad" },
          { keys: [mod, "Tab"], label: "Cycle through open apps" },
          { keys: [mod, ","], label: "Open Settings" },
          { keys: [mod, "⇧", "M"], label: "Study Mode picker" },
          { keys: [mod, "/"], label: "Show this shortcuts panel" },
          { keys: ["Esc"], label: "Close overlays / Spotlight" },
        ],
      },
      {
        title: "Focus & Lockdown",
        items: [
          { keys: [mod, "⇧", "L"], label: "Toggle Lockdown Mode" },
          { keys: [mod, "⇧", "A"], label: "Capture region → AI" },
        ],
      },
      {
        title: "Windows",
        items: [
          { keys: [mod, "M"], label: "Minimize focused window" },
          { keys: [mod, "W"], label: "Close focused window" },
          { keys: [mod, alt, "←"], label: "Snap window to left half" },
          { keys: [mod, alt, "→"], label: "Snap window to right half" },
          { keys: [mod, alt, "↑"], label: "Maximize / zoom window" },
          { keys: [mod, alt, "↓"], label: "Center window (restore)" },
          { keys: ["Drag to edge"], label: "Snap to edge half / corner quarter" },
          { keys: ["double-click title"], label: "Zoom / restore window" },
        ],
      },
    ],
    [mod, alt],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9800] flex items-center justify-center bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Keyboard className="h-4 w-4" />
                Keyboard Shortcuts
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white"
                aria-label="Close shortcuts"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
              {groups.map((g) => (
                <div key={g.title} className="flex flex-col gap-2">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
                    {g.title}
                  </div>
                  <div className="flex flex-col divide-y divide-white/5 rounded-lg border border-white/5 bg-white/[0.02]">
                    {g.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2">
                        <span className="text-[12.5px] text-white/80">{it.label}</span>
                        <span className="flex items-center gap-1">
                          {it.keys.map((k, j) => (
                            <Key key={j}>{k}</Key>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 px-5 py-2.5 text-[11px] text-white/45">
              Tip: most shortcuts work from anywhere except inside text inputs.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
