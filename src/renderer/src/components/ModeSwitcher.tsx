import { ChevronRight, Rocket, Sparkles, X } from "lucide-react";
import { useMemo } from "react";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { useFocus } from "../store/focus";
import { useNotifications } from "../store/notifications";
import { modeProgressToday, useModes, type StudyMode } from "../store/modes";
import Popover from "./Popover";
import clsx from "../utils/clsx";

function ProgressRing({
  pct,
  size = 16,
  color,
  trackColor = "rgba(255,255,255,0.18)",
}: {
  pct: number;
  size?: number;
  color: string;
  trackColor?: string;
}) {
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ModeSwitcher() {
  const modes = useModes((s) => s.modes);
  const activeId = useModes((s) => s.activeId);
  const setActive = useModes((s) => s.setActive);

  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);

  const focusSessions = useFocus((s) => s.sessions);
  const focusActive = useFocus((s) => s.active);
  const startFocus = useFocus((s) => s.start);
  const endFocus = useFocus((s) => s.end);
  const setHardLock = useFocus((s) => s.setHardLock);

  const pushNotification = useNotifications((s) => s.push);

  const active = modes.find((m) => m.id === activeId) ?? null;

  const progressPct = useMemo(() => {
    if (!active?.dailyGoalMins) return 0;
    const mins = modeProgressToday(active, focusSessions);
    return Math.min(100, Math.round((mins / active.dailyGoalMins) * 100));
  }, [active, focusSessions]);

  const launchMode = (mode: StudyMode) => {
    setActive(mode.id);

    const toOpen = mode.defaultApps
      .map((id) => plugins.find((p) => p.id === id))
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
  };

  const switchOnly = (mode: StudyMode) => {
    setActive(mode.id);
    pushNotification({
      kind: "system",
      icon: mode.icon,
      title: `Switched to ${mode.name}`,
      body: mode.tagline,
    });
  };

  const endMode = () => {
    setActive(null);
    if (focusActive) void endFocus();
    pushNotification({
      kind: "system",
      icon: "◇",
      title: "Mode ended",
      body: "Back to desktop defaults.",
    });
  };

  return (
    <Popover
      width={340}
      align="start"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          className={clsx(
            "flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] transition-colors",
            active
              ? "text-white"
              : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]",
            open && "bg-white/10",
          )}
          style={
            active
              ? {
                  borderColor: `${active.accent}66`,
                  backgroundColor: `${active.accent}1f`,
                  color: "#fff",
                }
              : undefined
          }
          title={active ? `${active.name} — ${active.tagline}` : "Pick a study mode"}
        >
          {active ? (
            <>
              <span className="text-[13px] leading-none">{active.icon}</span>
              <span className="font-medium">{active.name}</span>
              {active.dailyGoalMins && (
                <ProgressRing pct={progressPct} color={active.accent} size={14} />
              )}
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 opacity-70" />
              <span>Pick Mode</span>
            </>
          )}
        </button>
      )}
    >
      {active && (
        <div
          className="border-b border-white/10 px-3 py-3"
          style={{
            background: `linear-gradient(135deg, ${active.accent}33, ${active.accent}0a)`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[20px] ring-1"
              style={{
                backgroundColor: `${active.accent}26`,
                boxShadow: `0 0 0 1px ${active.accent}4d inset`,
              }}
            >
              {active.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-[13.5px] font-semibold text-white">{active.name}</div>
                <button
                  onClick={endMode}
                  className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] text-white/60 hover:bg-white/10 hover:text-white"
                  title="End mode"
                >
                  <X className="h-3 w-3" /> End
                </button>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-white/70">{active.tagline}</div>
              {active.dailyGoalMins && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-white/65">Today&apos;s goal</span>
                    <span className="tabular-nums text-white/80">
                      {modeProgressToday(active, focusSessions)}m / {active.dailyGoalMins}m
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: active.accent,
                      }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={() => launchMode(active)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/[0.08] py-1.5 text-[11.5px] font-medium text-white/90 hover:bg-white/[0.14]"
              >
                <Rocket className="h-3 w-3" /> Launch apps{active.focus.enabled ? " + focus" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-2 pb-2 pt-1">
        <div className="px-1 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {active ? "Switch to" : "Study modes"}
        </div>
        {modes.map((m) => {
          const isActive = m.id === activeId;
          const mins = modeProgressToday(m, focusSessions);
          return (
            <button
              key={m.id}
              onClick={() => (isActive ? launchMode(m) : switchOnly(m))}
              className={clsx(
                "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.06]",
              )}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[16px]"
                style={{
                  backgroundColor: `${m.accent}1f`,
                  boxShadow: isActive
                    ? `inset 0 0 0 1.5px ${m.accent}`
                    : `inset 0 0 0 1px ${m.accent}40`,
                }}
              >
                {m.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate text-[12.5px] font-medium text-white/90">{m.name}</div>
                  {m.dailyGoalMins && (
                    <div
                      className="shrink-0 text-[10px] tabular-nums"
                      style={{
                        color: mins >= m.dailyGoalMins ? m.accent : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {mins}/{m.dailyGoalMins}m
                    </div>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[10.5px] text-white/50">{m.tagline}</div>
              </div>
              {!isActive && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>
    </Popover>
  );
}
