import { useMemo, useState } from "react";
import Popover from "./Popover";
import { formatDuration, todayMs, useFocus } from "../store/focus";
import type { FocusSession } from "@shared/types";
import clsx from "../utils/clsx";

interface ClockTriggerProps {
  date: string;
  time: string;
  open: boolean;
  onClick: () => void;
}

function ClockTrigger({ date, time, open, onClick }: ClockTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 rounded px-2 py-0.5 hover:bg-white/10",
        open && "bg-white/10",
      )}
      title="Calendar & today's sessions"
    >
      <span className="tabular-nums text-white/85">{date}</span>
      <span className="tabular-nums text-white/95">{time}</span>
    </button>
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayHasFocus(sessions: FocusSession[], day: Date): boolean {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = start.getTime() + 24 * 60 * 60 * 1000;
  return sessions.some((s) => s.endedAt >= start.getTime() && s.endedAt < end);
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ClockPopover({ date, time }: { date: string; time: string }) {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const sessions = useFocus((s) => s.sessions);

  const now = new Date();

  const grid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const leading = first.getDay();
    const total = daysInMonth(viewMonth.getFullYear(), viewMonth.getMonth());
    const cells: Array<Date | null> = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const todaysSessions = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sessions
      .filter((s) => s.endedAt >= start.getTime())
      .sort((a, b) => b.endedAt - a.endedAt);
  }, [sessions]);

  const todayTotal = useMemo(() => todayMs(sessions), [sessions]);

  return (
    <Popover
      width={340}
      align="end"
      trigger={({ open, toggle }) => (
        <ClockTrigger date={date} time={time} open={open} onClick={toggle} />
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <button
          onClick={() =>
            setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
          }
          className="rounded px-2 py-0.5 text-[11px] text-white/55 hover:bg-white/[0.08] hover:text-white"
        >
          ‹
        </button>
        <div className="text-[12.5px] font-semibold text-white/90">
          {viewMonth.toLocaleDateString([], { month: "long", year: "numeric" })}
        </div>
        <button
          onClick={() =>
            setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
          }
          className="rounded px-2 py-0.5 text-[11px] text-white/55 hover:bg-white/[0.08] hover:text-white"
        >
          ›
        </button>
      </div>

      <div className="px-2 pb-2 pt-1">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w, i) => (
            <div key={`${w}-${i}`} className="py-1 text-[10px] font-medium text-white/35">
              {w}
            </div>
          ))}
          {grid.map((d, i) => {
            if (!d) return <div key={`blank-${i}`} className="h-7" />;
            const isToday = sameDay(d, now);
            const hasFocus = dayHasFocus(sessions, d);
            return (
              <div
                key={d.toISOString()}
                className={clsx(
                  "relative flex h-7 items-center justify-center rounded-md text-[11.5px]",
                  isToday
                    ? "bg-sky-500/90 font-semibold text-white"
                    : hasFocus
                      ? "bg-white/[0.05] text-white/85"
                      : "text-white/55",
                )}
              >
                {d.getDate()}
                {hasFocus && !isToday && (
                  <span className="absolute bottom-0.5 h-0.5 w-0.5 rounded-full bg-emerald-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 px-3 py-2">
        <div className="flex items-center justify-between text-[11.5px]">
          <div className="font-semibold text-white/85">Today</div>
          <div className="tabular-nums text-white/55">
            {todayTotal > 0 ? `${formatDuration(todayTotal)} focused` : "No focus yet"}
          </div>
        </div>
        {todaysSessions.length > 0 && (
          <div className="mt-1.5 max-h-[140px] space-y-1 overflow-y-auto">
            {todaysSessions.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1 text-[11px]"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="text-[12px]">{s.pluginIcon ?? "🎯"}</span>
                  <span className="truncate text-white/80">{s.pluginName}</span>
                </span>
                <span className="shrink-0 tabular-nums text-white/45">
                  {formatDuration(s.durationMs)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Popover>
  );
}
