import { Newspaper, ArrowUpRight } from "lucide-react";
import { useFeedUnread } from "../../hooks/useFeedUnread";
import { openInApp } from "../../utils/openInApp";
import Widget from "./Widget";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedWidget({
  delay,
  onOpenFeed,
}: {
  delay?: number;
  onOpenFeed?: () => void;
}) {
  const { count, items, markSeen } = useFeedUnread();
  const top = items.slice(0, 3);

  const openArticle = (url: string, title: string) => {
    markSeen();
    openInApp({ url, title });
  };

  return (
    <Widget
      title="Dev News"
      icon={<Newspaper className="h-3 w-3" />}
      accent="radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)"
      delay={delay}
      onClick={() => {
        markSeen();
        onOpenFeed?.();
      }}
      action={
        count > 0 && (
          <span className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-100">
            {count > 99 ? "99+" : count} new
          </span>
        )
      }
    >
      {top.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[12px] text-white/45">
          Fetching latest articles…
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {top.map((it) => (
            <li key={it.id}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openArticle(it.url, it.title);
                }}
                className="group flex w-full flex-col items-start gap-0.5 rounded-md px-1 py-1 text-left hover:bg-white/5"
              >
                <span className="line-clamp-2 text-[12.5px] leading-snug text-white/85 group-hover:text-white">
                  {it.title}
                </span>
                <span className="flex items-center gap-1.5 text-[10.5px] text-white/45">
                  {it.author && <span className="truncate">{it.author}</span>}
                  {it.publishedAt && <span>· {timeAgo(it.publishedAt)}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-white/40">
        <span>HN · GfG · Striver · freeCodeCamp</span>
        <span className="flex items-center gap-1 rounded-md border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-rose-100 transition-colors group-hover:border-rose-400/50 group-hover:bg-rose-500/20">
          Open <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Widget>
  );
}
