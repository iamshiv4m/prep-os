import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock, Rocket, Target, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useShell } from "../store/shell";
import { useFocus } from "../store/focus";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { useNotifications } from "../store/notifications";
import { modeProgressToday, useModes, type StudyMode } from "../store/modes";
import clsx from "../utils/clsx";

export default function ModePicker() {
  const open = useShell((s) => s.modePickerOpen);
  const setOpen = useShell((s) => s.setModePicker);

  const modes = useModes((s) => s.modes);
  const activeId = useModes((s) => s.activeId);
  const setActive = useModes((s) => s.setActive);

  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);

  const focusSessions = useFocus((s) => s.sessions);
  const focusActive = useFocus((s) => s.active);
  const startFocus = useFocus((s) => s.start);
  const setHardLock = useFocus((s) => s.setHardLock);

  const pushNotification = useNotifications((s) => s.push);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      const idx = parseInt(e.key, 10);
      if (!Number.isNaN(idx) && idx >= 1 && idx <= modes.length) {
        const m = modes[idx - 1];
        if (m) launchMode(m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modes]);

  const pluginsById = useMemo(() => {
    const m = new Map<string, (typeof plugins)[number]>();
    plugins.forEach((p) => m.set(p.id, p));
    return m;
  }, [plugins]);

  const launchMode = (mode: StudyMode) => {
    setActive(mode.id);
    const toOpen = mode.defaultApps
      .map((id) => pluginsById.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    toOpen.slice(0, 4).forEach((plugin, idx) => {
      setTimeout(() => openApp(plugin), idx * 90);
    });

    if (mode.focus.enabled && !focusActive) {
      setHardLock(mode.focus.hardLock);
      const target = toOpen[0];
      if (target) {
        setTimeout(() => startFocus(target), toOpen.length * 90 + 200);
      }
    }

    pushNotification({
      kind: "system",
      icon: mode.icon,
      title: `${mode.name} mode activated`,
      body: `${toOpen.length} apps opening${mode.focus.enabled ? " · focus engaged" : ""}${mode.dailyGoalMins ? ` · goal ${mode.dailyGoalMins}m today` : ""}`,
    });

    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[9700] flex items-center justify-center bg-black/55 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="border-white/12 relative w-[760px] max-w-[92vw] overflow-hidden rounded-2xl border bg-neutral-950/95 shadow-[0_30px_80px_-18px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-white/65" />
                <div>
                  <div className="text-[14px] font-semibold text-white">Pick a study mode</div>
                  <div className="text-[11px] text-white/50">
                    Presets tuned for the kind of session you want right now
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3">
              {modes.map((m, i) => {
                const isActive = m.id === activeId;
                const mins = modeProgressToday(m, focusSessions);
                const pct = m.dailyGoalMins
                  ? Math.min(100, Math.round((mins / m.dailyGoalMins) * 100))
                  : 0;
                const apps = m.defaultApps
                  .map((id) => pluginsById.get(id))
                  .filter((p): p is NonNullable<typeof p> => Boolean(p))
                  .slice(0, 5);

                return (
                  <button
                    key={m.id}
                    onClick={() => launchMode(m)}
                    className={clsx(
                      "group relative flex flex-col overflow-hidden rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5",
                      isActive
                        ? "border-transparent shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]"
                        : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
                    )}
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(160deg, ${m.accent}2a, ${m.accent}0a)`,
                            boxShadow: `inset 0 0 0 1px ${m.accent}80, 0 14px 40px -14px ${m.accent}66`,
                          }
                        : undefined
                    }
                  >
                    <div
                      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold text-white/50 transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      {i + 1}
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[22px]"
                        style={{
                          backgroundColor: `${m.accent}20`,
                          boxShadow: `inset 0 0 0 1px ${m.accent}50`,
                        }}
                      >
                        {m.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <div className="truncate text-[13.5px] font-semibold text-white">
                            {m.name}
                          </div>
                          {m.focus.hardLock && (
                            <Lock
                              className="h-3 w-3 shrink-0"
                              style={{ color: m.accent }}
                              aria-label="Hard-lock focus"
                            />
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[10.5px] text-white/55">
                          {m.tagline}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 line-clamp-2 text-[11.5px] leading-relaxed text-white/60">
                      {m.description}
                    </div>

                    <div className="mt-3 flex items-center gap-1">
                      {apps.map((a) => (
                        <div
                          key={a.id}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[13px] ring-1 ring-white/10"
                          title={a.name}
                        >
                          {a.icon}
                        </div>
                      ))}
                      {m.defaultApps.length > apps.length && (
                        <div className="text-[10px] text-white/40">
                          +{m.defaultApps.length - apps.length}
                        </div>
                      )}
                    </div>

                    {m.dailyGoalMins && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white/50">Goal today</span>
                          <span className="tabular-nums text-white/65">
                            {mins}/{m.dailyGoalMins}m
                          </span>
                        </div>
                        <div className="bg-white/8 mt-1 h-1 w-full overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: m.accent,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {isActive && (
                      <div
                        className="mt-3 flex items-center gap-1 text-[10.5px] font-medium"
                        style={{ color: m.accent }}
                      >
                        <Check className="h-3 w-3" /> Active now
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-5 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-white/45">
                <Rocket className="h-3 w-3" /> Press 1–{modes.length} to launch quickly
              </div>
              <div className="text-[11px] text-white/35">⌘⇧M to open · Esc to close</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
