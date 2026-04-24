import { ArrowUpRight, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContestItem, ContestSnapshot } from "@shared/types";
import { openInApp } from "../../utils/openInApp";
import clsx from "../../utils/clsx";
import Widget from "./Widget";

const PLATFORM_DOT: Record<ContestItem["platform"], string> = {
  codeforces: "bg-orange-400",
  leetcode: "bg-yellow-300",
};

const PLATFORM_LABEL: Record<ContestItem["platform"], string> = {
  codeforces: "CF",
  leetcode: "LC",
};

function countdown(ms: number): string {
  if (ms <= 0) return "live";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

export default function ContestsWidget({
  delay,
  onOpenContests,
}: {
  delay?: number;
  onOpenContests?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<ContestSnapshot | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await window.prepOS.contests.list();
        if (!cancelled) setSnapshot(data);
      } catch {
        // Cache is the only source of truth in the widget; an empty state is fine.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-render the widget every minute so the countdown labels stay fresh
  // ("in 12h 30m" → "in 12h 29m") without re-fetching upstream data.
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const top = (snapshot?.items ?? []).slice(0, 3);

  return (
    <Widget
      title="Contests"
      icon={<Trophy className="h-3 w-3" />}
      accent="radial-gradient(circle, rgba(250,204,21,0.4) 0%, transparent 70%)"
      delay={delay}
      onClick={onOpenContests}
      action={
        top.length > 0 && (
          <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
            {top.length} next
          </span>
        )
      }
    >
      {top.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[12px] text-white/45">
          Fetching upcoming contests…
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {top.map((c) => {
            const ms = c.startsAt - Date.now();
            return (
              <li key={c.id}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openInApp({ url: c.url, title: c.name });
                  }}
                  className="group/row flex w-full items-start gap-2 rounded-md px-1 py-1 text-left hover:bg-white/5"
                >
                  <span
                    className={clsx("mt-1 h-2 w-2 shrink-0 rounded-full", PLATFORM_DOT[c.platform])}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-1 text-[12.5px] leading-snug text-white/85 group-hover/row:text-white">
                      {c.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10.5px] text-white/45">
                      <span className="font-medium tracking-wider text-white/55">
                        {PLATFORM_LABEL[c.platform]}
                      </span>
                      <span>· {countdown(ms)}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-white/40">
        <span>LeetCode · Codeforces</span>
        <span className="flex items-center gap-1 rounded-md border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-amber-100 transition-colors group-hover:border-amber-400/50 group-hover:bg-amber-500/20">
          Open <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Widget>
  );
}
