import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  formatDuration,
  last7DaysMs,
  perPluginMs,
  todayMs,
  useFocus,
  yesterdayMs,
} from "../store/focus";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";

interface FocusStatsProps {
  open: boolean;
  onClose: () => void;
}

export default function FocusStats({ open, onClose }: FocusStatsProps) {
  const sessions = useFocus((s) => s.sessions);
  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);

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

  const today = useMemo(() => todayMs(sessions), [sessions]);
  const yesterday = useMemo(() => yesterdayMs(sessions), [sessions]);
  const week = useMemo(() => last7DaysMs(sessions), [sessions]);
  const topPlugins = useMemo(() => perPluginMs(sessions).slice(0, 3), [sessions]);

  const openSettings = () => {
    const settings = plugins.find((p) => p.id === "settings");
    if (settings) {
      openApp(settings, { tab: "focus" });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[9400]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="no-drag fixed right-3 top-8 z-[9450] w-72 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/85 text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wider text-white/50">
              <Clock className="h-3.5 w-3.5" />
              Focus time
            </div>

            <div className="flex items-end justify-between gap-3 px-4 pb-2 pt-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/45">Today</div>
                <div className="mt-0.5 text-2xl font-semibold tabular-nums text-white">
                  {formatDuration(today)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-white/45">Yesterday</div>
                <div className="mt-0.5 text-sm tabular-nums text-white/80">
                  {formatDuration(yesterday)}
                </div>
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>Last 7 days</span>
                <span className="tabular-nums text-white/80">{formatDuration(week)}</span>
              </div>
            </div>

            {topPlugins.length > 0 && (
              <div className="border-t border-white/10 px-4 py-3">
                <div className="mb-2 text-[11px] uppercase tracking-wider text-white/45">
                  Top apps
                </div>
                <div className="flex flex-col gap-1.5">
                  {topPlugins.map((p) => (
                    <div key={p.pluginId} className="flex items-center gap-2 text-xs">
                      <span className="text-base">{p.pluginIcon ?? "•"}</span>
                      <span className="flex-1 truncate text-white/80">{p.pluginName}</span>
                      <span className="tabular-nums text-white/50">
                        {formatDuration(p.durationMs)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={openSettings}
              className="flex w-full items-center justify-between border-t border-white/10 px-4 py-2.5 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span>Open focus history</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
