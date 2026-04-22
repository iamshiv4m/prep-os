import { AlertTriangle, ExternalLink, Loader2, Newspaper, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedItem, FeedSnapshot, FeedSource } from "@shared/types";

export default function DevNews() {
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(null);
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [srcs, snap] = await Promise.all([
          window.prepOS.feed.sources(),
          window.prepOS.feed.list(),
        ]);
        if (cancelled) return;
        setSources(srcs);
        setSnapshot(snap);
        setSelectedId(snap.items[0]?.id ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const snap = await window.prepOS.feed.refresh();
      setSnapshot(snap);
      if (!snap.items.find((i) => i.id === selectedId)) {
        setSelectedId(snap.items[0]?.id ?? null);
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, selectedId]);

  const sourceMap = useMemo(() => {
    const map = new Map<string, FeedSource>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    snapshot?.items.forEach((i) => {
      map.set(i.sourceId, (map.get(i.sourceId) ?? 0) + 1);
    });
    return map;
  }, [snapshot]);

  const visibleItems = useMemo(() => {
    if (!snapshot) return [];
    if (!sourceFilter) return snapshot.items;
    return snapshot.items.filter((i) => i.sourceId === sourceFilter);
  }, [snapshot, sourceFilter]);

  const selected = useMemo(
    () => visibleItems.find((i) => i.id === selectedId) ?? visibleItems[0],
    [visibleItems, selectedId],
  );

  useEffect(() => {
    if (visibleItems.length === 0) return;
    if (!visibleItems.find((i) => i.id === selectedId)) {
      setSelectedId(visibleItems[0].id);
    }
  }, [visibleItems, selectedId]);

  return (
    <div className="flex h-full w-full bg-neutral-950/80 text-white">
      <aside className="flex w-[340px] shrink-0 flex-col border-r border-white/10 bg-black/30">
        <header className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-white/70" />
            <div className="text-[13px] font-semibold tracking-tight">Dev News</div>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing || loading}
            className="rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            title="Refresh feed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </header>

        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          <FilterChip
            label="All"
            count={snapshot?.items.length ?? 0}
            active={sourceFilter === null}
            onClick={() => setSourceFilter(null)}
          />
          {sources.map((s) => {
            const n = counts.get(s.id) ?? 0;
            if (n === 0) return null;
            return (
              <FilterChip
                key={s.id}
                icon={s.icon}
                label={s.name}
                count={n}
                active={sourceFilter === s.id}
                onClick={() => setSourceFilter(s.id)}
              />
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 px-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-white/50">
              <Newspaper className="h-6 w-6 opacity-60" />
              <div>No articles yet.</div>
              <button
                onClick={onRefresh}
                className="mt-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs transition hover:bg-white/10"
              >
                Try refreshing
              </button>
            </div>
          ) : (
            <ul className="space-y-1 px-2 py-1.5">
              {visibleItems.map((item) => (
                <ArticleRow
                  key={item.id}
                  item={item}
                  source={sourceMap.get(item.sourceId)}
                  active={item.id === selected?.id}
                  onSelect={() => setSelectedId(item.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-white/5 px-4 py-2 text-[10.5px] text-white/40">
          {snapshot
            ? `Updated ${timeAgo(snapshot.updatedAt)} · ${snapshot.items.length} articles`
            : "Loading…"}
        </footer>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {snapshot && snapshot.errors.length > 0 && (
          <div className="flex items-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-[11.5px] text-amber-200/90">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              Couldn&apos;t load:{" "}
              {snapshot.errors.map((e) => sourceMap.get(e.sourceId)?.name ?? e.sourceId).join(", ")}
            </span>
          </div>
        )}

        {selected ? (
          <ArticlePreview item={selected} source={sourceMap.get(selected.sourceId)} />
        ) : loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading dev news…
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/50">
            Select an article to preview it here.
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] transition ${
        active
          ? "border-white/30 bg-white/15 text-white"
          : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white/85"
      }`}
    >
      {icon && <span className="text-[11px]">{icon}</span>}
      <span>{label}</span>
      <span className="text-white/40">{count}</span>
    </button>
  );
}

function ArticleRow({
  item,
  source,
  active,
  onSelect,
}: {
  item: FeedItem;
  source: FeedSource | undefined;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
          active
            ? "border-white/20 bg-white/10"
            : "border-transparent hover:border-white/10 hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-1.5 text-[10.5px] text-white/55">
          <span>{source?.icon ?? "📄"}</span>
          <span className="truncate font-medium">{source?.name ?? item.sourceId}</span>
          <span className="text-white/30">·</span>
          <span>{timeAgo(item.publishedAt)}</span>
        </div>
        <div className="mt-0.5 line-clamp-2 text-[12.5px] font-medium leading-snug text-white/95">
          {item.title}
        </div>
        {item.description && (
          <div className="mt-1 line-clamp-1 text-[11px] text-white/50">{item.description}</div>
        )}
      </button>
    </li>
  );
}

function ArticlePreview({ item, source }: { item: FeedItem; source: FeedSource | undefined }) {
  const open = () => {
    void window.prepOS.openExternal(item.url);
  };
  let host = item.url;
  try {
    host = new URL(item.url).host.replace(/^www\./, "");
  } catch {
    /* keep full url */
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-2 text-[11px] text-white/55">
          <span className="text-[13px]">{source?.icon ?? "📄"}</span>
          <span className="font-medium text-white/80">{source?.name ?? item.sourceId}</span>
          {item.author && (
            <>
              <span className="text-white/25">·</span>
              <span>{item.author}</span>
            </>
          )}
          <span className="text-white/25">·</span>
          <span>{timeAgo(item.publishedAt)}</span>
          <span className="text-white/25">·</span>
          <span className="truncate">{host}</span>
        </div>
        <h1 className="mt-2 text-[20px] font-semibold leading-tight tracking-tight text-white">
          {item.title}
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {item.description ? (
          <p className="max-w-prose whitespace-pre-line text-[13.5px] leading-relaxed text-white/75">
            {item.description}
          </p>
        ) : (
          <p className="text-[13px] italic text-white/45">
            No preview available. Open in your browser to read the full article.
          </p>
        )}
      </div>

      <div className="border-t border-white/10 px-6 py-4">
        <button
          onClick={open}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-[13px] font-medium text-white transition hover:border-white/25 hover:bg-white/15"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in browser
        </button>
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
