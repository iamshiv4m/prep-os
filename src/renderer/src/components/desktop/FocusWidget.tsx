import { ArrowUpRight, Flame, Timer } from "lucide-react";
import { useEffect, useMemo } from "react";
import { formatDuration, useFocus, todayMs } from "../../store/focus";
import Widget from "./Widget";

const DAY_MS = 24 * 60 * 60 * 1000;

function streakDays(sessions: { endedAt: number; durationMs: number }[]): number {
  if (sessions.length === 0) return 0;
  const dayKey = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const activeDays = new Set<number>();
  for (const s of sessions) {
    if (s.durationMs >= 60_000) activeDays.add(dayKey(s.endedAt));
  }
  let streak = 0;
  let cursor = dayKey(Date.now());
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

export default function FocusWidget({
  delay,
  onOpenFocus,
}: {
  delay?: number;
  onOpenFocus?: () => void;
}) {
  const sessions = useFocus((s) => s.sessions);
  const refresh = useFocus((s) => s.refresh);
  const active = useFocus((s) => s.active);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const today = useMemo(() => todayMs(sessions), [sessions]);
  const streak = useMemo(() => streakDays(sessions), [sessions]);

  const TARGET_MIN = 120; // 2h goal
  const pct = Math.min(100, Math.round((today / 60000 / TARGET_MIN) * 100));

  return (
    <Widget
      title="Focus · Today"
      icon={<Timer className="h-3 w-3" />}
      accent="radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)"
      delay={delay}
      onClick={onOpenFocus}
      action={
        active && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            LIVE
          </span>
        )
      }
    >
      <div className="flex items-baseline gap-2">
        <div className="text-[32px] font-semibold leading-none text-white">
          {formatDuration(today)}
        </div>
        <div className="text-[11px] text-white/50">/ {TARGET_MIN}m goal</div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-auto flex items-center justify-between pt-3 text-[11.5px] text-white/65">
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-300" />
          <span>
            <span className="font-semibold text-white/90">{streak}</span> day streak
            {streak === 1 ? "" : "s"}
          </span>
        </div>
        <span className="flex items-center gap-1 rounded-md border border-indigo-400/25 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-100 transition-colors group-hover:border-indigo-400/50 group-hover:bg-indigo-500/20">
          Tracker <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Widget>
  );
}
