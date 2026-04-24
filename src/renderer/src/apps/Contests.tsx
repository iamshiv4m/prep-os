import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContestItem, ContestPlatform, ContestSnapshot } from "@shared/types";
import { openInApp } from "../utils/openInApp";
import clsx from "../utils/clsx";

const ALL = "__all__";

const PLATFORM_META: Record<
  ContestPlatform,
  { label: string; pill: string; dot: string; short: string }
> = {
  codeforces: {
    label: "Codeforces",
    short: "CF",
    pill: "border-orange-400/40 bg-orange-500/15 text-orange-100",
    dot: "bg-orange-400",
  },
  leetcode: {
    label: "LeetCode",
    short: "LC",
    pill: "border-amber-300/40 bg-amber-300/15 text-amber-100",
    dot: "bg-yellow-300",
  },
};

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function countdown(ms: number): string {
  if (ms <= 0) return "live now";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface DayBucket {
  key: number;
  label: string;
  items: ContestItem[];
}

function bucketLabel(dayStart: number, todayStart: number): string {
  const diffDays = Math.round((dayStart - todayStart) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays < 7) return "This week";
  return new Date(dayStart).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function groupByDay(items: ContestItem[]): DayBucket[] {
  const todayStart = startOfDay(Date.now());
  const buckets = new Map<number, DayBucket>();

  for (const item of items) {
    const day = startOfDay(item.startsAt);
    const label = bucketLabel(day, todayStart);

    // "This week" should fold Tue–Sat into one bucket so it doesn't blur
    // every day from now to next Sunday into the same heading.
    const key = label === "This week" ? -1 : day;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { key, label, items: [] };
      buckets.set(key, bucket);
    }
    bucket.items.push(item);
  }

  // Sort buckets: Today / Tomorrow first, then This week, then chronological dates.
  const order = (b: DayBucket): number => {
    if (b.label === "Today") return 0;
    if (b.label === "Tomorrow") return 1;
    if (b.label === "This week") return 2;
    return 10 + b.key;
  };
  return Array.from(buckets.values()).sort((a, b) => order(a) - order(b));
}

export default function Contests() {
  const [snapshot, setSnapshot] = useState<ContestSnapshot | null>(null);
  const [selected, setSelected] = useState<string>(ALL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.prepOS.contests.list();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load contests");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.prepOS.contests.refresh();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't refresh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Tick every minute so countdown labels stay accurate without re-fetching.
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const map = new Map<ContestPlatform, number>();
    for (const it of snapshot?.items ?? []) {
      map.set(it.platform, (map.get(it.platform) ?? 0) + 1);
    }
    return map;
  }, [snapshot]);

  const visible = useMemo<ContestItem[]>(() => {
    const all = snapshot?.items ?? [];
    if (selected === ALL) return all;
    return all.filter((i) => i.platform === selected);
  }, [snapshot, selected]);

  const buckets = useMemo(() => groupByDay(visible), [visible]);

  const updated = snapshot?.updatedAt
    ? new Date(snapshot.updatedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex h-full w-full bg-[#0d0d10] text-white">
      <aside className="flex w-[210px] shrink-0 flex-col border-r border-white/[0.06] bg-black/25 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400/30 to-orange-500/30 ring-1 ring-white/10">
            <Trophy className="h-3.5 w-3.5 text-white/85" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-white/90">Contests</div>
            <div className="truncate text-[10px] text-white/40">
              {updated ? `Updated ${updated}` : loading ? "Loading…" : "Pull to refresh"}
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pt-2">
          <SidebarRow
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="All platforms"
            count={snapshot?.items.length ?? 0}
            active={selected === ALL}
            onClick={() => setSelected(ALL)}
          />
          <div className="mx-2 mb-1 mt-3 text-[10px] uppercase tracking-[0.12em] text-white/30">
            Platforms
          </div>
          {(Object.keys(PLATFORM_META) as ContestPlatform[]).map((platform) => {
            const meta = PLATFORM_META[platform];
            const errored = snapshot?.errors.some((e) => e.platform === platform);
            return (
              <SidebarRow
                key={platform}
                icon={
                  <span className={clsx("h-2.5 w-2.5 rounded-full", meta.dot)} aria-hidden />
                }
                label={meta.label}
                count={counts.get(platform) ?? 0}
                errored={errored}
                active={selected === platform}
                onClick={() => setSelected(platform)}
              />
            );
          })}
        </nav>
        <div className="p-3 text-[10px] text-white/35">
          Cached locally. Auto-refresh every 30 minutes.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black/25 px-3">
          <div className="flex flex-1 items-center gap-2 text-[12px] text-white/70">
            <CalendarDays className="h-3.5 w-3.5 text-white/45" />
            <span className="font-medium text-white/85">
              {selected === ALL
                ? "All upcoming contests"
                : `${PLATFORM_META[selected as ContestPlatform].label} only`}
            </span>
            <span className="text-white/35">· {visible.length} listed</span>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className={clsx(
              "flex h-7 items-center gap-1 rounded-md border border-white/10 px-2.5 text-[11px] text-white/75 transition-colors",
              loading ? "cursor-wait" : "hover:bg-white/10 hover:text-white",
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>{loading ? "Refreshing" : "Refresh"}</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-[12px] text-red-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        {snapshot?.errors.length ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 text-[11px] text-amber-200/85">
            <AlertTriangle className="h-3 w-3" />
            <span>Some platforms had issues:</span>
            {snapshot.errors.map((e) => (
              <span
                key={e.platform}
                className="rounded border border-amber-400/30 bg-amber-500/10 px-1.5 py-[1px]"
              >
                {PLATFORM_META[e.platform as ContestPlatform]?.label ?? e.platform}: {e.message}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <EmptyState loading={loading && !snapshot} />
          ) : (
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {buckets.map((bucket) => (
                  <motion.section
                    key={`${bucket.label}-${bucket.key}`}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="sticky top-0 z-[1] border-b border-white/[0.05] bg-[#0d0d10]/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 backdrop-blur">
                      {bucket.label}
                      <span className="ml-2 text-[10px] tracking-normal text-white/35">
                        {bucket.items.length} contest{bucket.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <ul className="divide-y divide-white/5">
                      {bucket.items.map((item) => (
                        <ContestRow key={item.id} item={item} />
                      ))}
                    </ul>
                  </motion.section>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContestRow({ item }: { item: ContestItem }) {
  const meta = PLATFORM_META[item.platform];
  const ms = item.startsAt - Date.now();
  const startsAtLabel = new Date(item.startsAt).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const handleOpen = () => {
    openInApp({ url: item.url, title: item.name });
  };
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={handleOpen}
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.06] ring-1 ring-white/10">
          <span className={clsx("h-2.5 w-2.5 rounded-full", meta.dot)} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "rounded-full border px-1.5 py-[1px] text-[10px] font-semibold tracking-wide",
                meta.pill,
              )}
            >
              {meta.label}
            </span>
            <span className="truncate text-[10px] text-white/40">{startsAtLabel}</span>
            <span className="text-[10px] text-white/40">· {formatDuration(item.durationMs)}</span>
          </div>
          <div className="mt-0.5 truncate text-[13px] font-semibold text-white/95 group-hover:text-white">
            {item.name}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10.5px] tabular-nums text-white/70">
            {countdown(ms)}
          </span>
          <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/65 transition-colors group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">
            Open contest <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </button>
    </motion.li>
  );
}

function SidebarRow({
  icon,
  label,
  count,
  active,
  errored,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  errored?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] transition-colors",
        active
          ? "bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "text-white/70 hover:bg-white/[0.06] hover:text-white/95",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {errored ? (
        <AlertTriangle className="h-3 w-3 text-amber-300/70" />
      ) : count > 0 ? (
        <span className="text-[10px] tabular-nums text-white/40 group-hover:text-white/60">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white/60">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      ) : (
        <>
          <Trophy className="h-6 w-6 text-white/30" />
          <div className="text-[13px]">No upcoming contests for this filter.</div>
          <div className="max-w-sm text-[12px] text-white/45">
            Try switching to &ldquo;All platforms&rdquo; or hit refresh to pull the latest schedule.
          </div>
        </>
      )}
    </div>
  );
}
