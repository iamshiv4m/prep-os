import { Camera, Lock, Sparkles, Target, Wifi } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useShell } from "../store/shell";
import { useWindows } from "../store/windows";
import { usePlugins } from "../store/plugins";
import { formatDuration, formatTimer, todayMs, useFocus } from "../store/focus";
import FocusStats from "./FocusStats";
import clsx from "../utils/clsx";

export default function Menubar() {
  const [now, setNow] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [statsOpen, setStatsOpen] = useState(false);

  const toggleSpotlight = useShell((s) => s.toggleSpotlight);
  const focusedId = useWindows((s) => s.focusedId);
  const windows = useWindows((s) => s.windows);
  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);

  const focusActive = useFocus((s) => s.active);
  const focusStartedAt = useFocus((s) => s.startedAt);
  const focusTargetId = useFocus((s) => s.targetPluginId);
  const focusSessions = useFocus((s) => s.sessions);
  const focusHardLock = useFocus((s) => s.hardLock);
  const startFocus = useFocus((s) => s.start);
  const endFocus = useFocus((s) => s.end);
  const openPicker = useFocus((s) => s.openPicker);

  const focused = windows.find((w) => w.id === focusedId);
  const focusedPlugin = focused ? plugins.find((p) => p.id === focused.pluginId) : undefined;
  const targetPlugin = focusTargetId ? plugins.find((p) => p.id === focusTargetId) : undefined;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!focusActive || focusStartedAt == null) {
      setElapsed(0);
      return;
    }
    setElapsed(Date.now() - focusStartedAt);
    const t = setInterval(() => {
      setElapsed(Date.now() - focusStartedAt);
    }, 1000);
    return () => clearInterval(t);
  }, [focusActive, focusStartedAt]);

  const today = useMemo(() => todayMs(focusSessions), [focusSessions]);

  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const handleFocusClick = () => {
    if (focusActive) {
      void endFocus();
      return;
    }
    if (focusedPlugin) {
      startFocus(focusedPlugin);
    } else {
      openPicker();
    }
  };

  return (
    <div className="drag-region fixed inset-x-0 top-0 z-[9200] flex h-7 items-center justify-between border-b border-white/5 bg-black/30 px-4 text-[12px] text-white/90 backdrop-blur-xl">
      <div className="flex items-center gap-4 pl-20">
        <span className="font-semibold"> PrepOS</span>
        <span className="text-white/70">{focusedPlugin?.name ?? "Desktop"}</span>
        <span className="text-white/40">File</span>
        <span className="text-white/40">Edit</span>
        <span className="text-white/40">View</span>
      </div>
      <div className="no-drag flex items-center gap-3">
        {focusActive ? (
          <div
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5",
              focusHardLock
                ? "border-amber-300/40 bg-amber-500/15 text-amber-200"
                : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
            )}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={clsx(
                  "absolute inset-0 animate-ping rounded-full",
                  focusHardLock ? "bg-amber-400/60" : "bg-emerald-400/60",
                )}
              />
              <span
                className={clsx(
                  "relative h-2 w-2 rounded-full",
                  focusHardLock ? "bg-amber-400" : "bg-emerald-400",
                )}
              />
            </span>
            {focusHardLock && (
              <Lock className="h-3 w-3 text-amber-200/90" aria-label="Hard focus mode" />
            )}
            <span
              className="text-[11px] tabular-nums"
              title={
                focusHardLock
                  ? "Hard focus mode — app is locked until session ends"
                  : targetPlugin
                    ? `Focusing on ${targetPlugin.name}`
                    : "Focus session"
              }
            >
              {formatTimer(elapsed)}
            </span>
            <button
              onClick={handleFocusClick}
              className={clsx(
                "ml-1 rounded px-1 text-[10px] uppercase tracking-wider hover:bg-white/10 hover:text-white",
                focusHardLock ? "text-amber-100/85" : "text-emerald-100/80",
              )}
              title="End focus session"
            >
              End
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleFocusClick}
              className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10"
              title="Start focus session"
            >
              <Target className="h-3.5 w-3.5" />
              <span className="text-[11px]">Focus</span>
            </button>
            {today > 0 && (
              <button
                onClick={() => setStatsOpen((v) => !v)}
                className={clsx(
                  "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-white/70 hover:bg-white/10",
                  statsOpen && "bg-white/10 text-white",
                )}
                title="Focus stats"
              >
                {formatDuration(today)} today
              </button>
            )}
          </>
        )}
        <button
          onClick={async () => {
            await window.prepOS.captures.trigger();
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10"
          title="Capture region · Cmd+Shift+A"
        >
          <Camera className="h-3.5 w-3.5" />
          <span className="text-[11px]">Capture</span>
        </button>
        <button
          onClick={() => {
            const ai = plugins.find((p) => p.id === "ai-chat");
            if (ai) openApp(ai);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10"
          title="Open AI Chat"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[11px]">AI</span>
        </button>
        <Wifi className="h-3.5 w-3.5 opacity-80" />
        <button
          onClick={toggleSpotlight}
          className="rounded px-2 py-0.5 hover:bg-white/10"
          title="Spotlight · Cmd+K"
        >
          🔎
        </button>
        <span className="tabular-nums text-white/85">{date}</span>
        <span className="tabular-nums text-white/95">{time}</span>
      </div>
      <FocusStats open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}
