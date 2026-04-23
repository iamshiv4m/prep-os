import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpen, Loader2, RefreshCw, Rss, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedCategory, FeedItem, FeedSnapshot, FeedSource } from "@shared/types";
import { openInApp } from "../utils/openInApp";
import { useNotifications } from "../store/notifications";
import clsx from "../utils/clsx";

const ALL = "__all__";

const CATEGORY_ORDER: FeedCategory[] = ["frontend", "backend", "system-design", "general"];

const CATEGORY_LABELS: Record<FeedCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  "system-design": "System Design",
  general: "General",
};

function hostnameFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Feed() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(null);
  const [selected, setSelected] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.prepOS.feed.list();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.prepOS.feed.refresh();
      setSnapshot((prev) => {
        const prevIds = new Set((prev?.items ?? []).map((i) => i.id));
        const added = data.items.filter((i) => !prevIds.has(i.id)).length;
        if (prev && added > 0) {
          useNotifications.getState().push({
            kind: "feed",
            icon: "📰",
            title: `${added} new ${added === 1 ? "article" : "articles"} in Dev News`,
            body: data.items
              .filter((i) => !prevIds.has(i.id))
              .slice(0, 2)
              .map((i) => `• ${i.title}`)
              .join("\n"),
          });
        }
        return data;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't refresh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const list = await window.prepOS.feed.sources();
      setSources(list);
    })();
    void load();
  }, [load]);

  const sourceById = useMemo(() => {
    const map = new Map<string, FeedSource>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const items = useMemo<FeedItem[]>(() => {
    const all = snapshot?.items ?? [];
    const bySource = selected === ALL ? all : all.filter((i) => i.sourceId === selected);
    const q = query.trim().toLowerCase();
    if (!q) return bySource;
    return bySource.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false) ||
        (i.author?.toLowerCase().includes(q) ?? false),
    );
  }, [snapshot, selected, query]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of snapshot?.items ?? []) {
      map.set(it.sourceId, (map.get(it.sourceId) ?? 0) + 1);
    }
    return map;
  }, [snapshot]);

  const groupedSources = useMemo(() => {
    const groups = new Map<FeedCategory, FeedSource[]>();
    for (const s of sources) {
      const cat: FeedCategory = s.category ?? "general";
      const bucket = groups.get(cat);
      if (bucket) bucket.push(s);
      else groups.set(cat, [s]);
    }
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      sources: groups.get(cat) ?? [],
    })).filter((g) => g.sources.length > 0);
  }, [sources]);

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
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-400/30 to-rose-500/30 ring-1 ring-white/10">
            <Rss className="h-3.5 w-3.5 text-white/85" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-white/90">Feed</div>
            <div className="truncate text-[10px] text-white/40">
              {updated ? `Updated ${updated}` : "Loading…"}
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pt-2">
          <SidebarRow
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="All sources"
            count={snapshot?.items.length ?? 0}
            active={selected === ALL}
            onClick={() => setSelected(ALL)}
          />
          {groupedSources.map((group) => (
            <div key={group.category}>
              <div className="mx-2 mb-1 mt-3 text-[10px] uppercase tracking-[0.12em] text-white/30">
                {group.label}
              </div>
              {group.sources.map((s) => {
                const errored = snapshot?.errors.some((e) => e.sourceId === s.id);
                return (
                  <SidebarRow
                    key={s.id}
                    icon={<span className="text-[14px] leading-none">{s.icon}</span>}
                    label={s.name}
                    count={counts.get(s.id) ?? 0}
                    errored={errored}
                    active={selected === s.id}
                    onClick={() => setSelected(s.id)}
                  />
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-3 text-[10px] text-white/35">Articles open right here in PrepOS.</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black/25 px-3">
          <div className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selected === ALL
                  ? "Search all articles…"
                  : `Search ${sourceById.get(selected)?.name ?? ""}…`
              }
              className="h-7 w-full rounded-md border border-white/10 bg-white/[0.04] pl-8 pr-2 text-[12px] text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
            />
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

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState loading={loading && !snapshot} query={query} />
          ) : (
            <ul className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <ArticleRow key={item.id} item={item} source={sourceById.get(item.sourceId)} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
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

function ArticleRow({ item, source }: { item: FeedItem; source?: FeedSource }) {
  const host = hostnameFor(item.url);
  const handleOpen = () => {
    openInApp({
      url: item.url,
      title: item.title,
      sourceName: source?.name,
      sourceIcon: source?.icon,
    });
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
        className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[18px] ring-1 ring-white/10">
          {source?.icon ?? "📰"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/50">
              {source?.name ?? host}
            </span>
            <span className="text-[10px] text-white/35">· {formatRelative(item.publishedAt)}</span>
            {item.author && (
              <span className="truncate text-[10px] text-white/35">· {item.author}</span>
            )}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold leading-snug text-white/95 group-hover:text-white">
            {item.title}
          </div>
          {item.description && (
            <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/60">
              {item.description}
            </div>
          )}
        </div>
        <BookOpen className="mt-1 h-3.5 w-3.5 shrink-0 text-white/25 transition-colors group-hover:text-white/70" />
      </button>
    </motion.li>
  );
}

function EmptyState({ loading, query }: { loading: boolean; query: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center text-white/60">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      ) : query ? (
        <>
          <Search className="h-6 w-6 text-white/30" />
          <div className="text-[13px]">No matches for “{query}”.</div>
        </>
      ) : (
        <>
          <Rss className="h-6 w-6 text-white/30" />
          <div className="text-[13px]">Nothing here yet.</div>
          <div className="max-w-sm text-[12px] text-white/45">
            Hit refresh to pull the latest articles. Feeds update every 20 minutes automatically.
          </div>
        </>
      )}
    </div>
  );
}
