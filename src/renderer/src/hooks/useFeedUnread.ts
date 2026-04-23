import { useCallback, useEffect, useState } from "react";
import type { FeedItem } from "@shared/types";

const SEEN_KEY = "prepos:feed:lastSeenAt";

function getLastSeen(): number {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function setLastSeen(ts: number): void {
  try {
    localStorage.setItem(SEEN_KEY, String(ts));
  } catch {
    /* ignore quota */
  }
}

/**
 * Tracks how many feed articles are newer than the last time the user opened
 * Dev News. We persist the "last seen" timestamp in localStorage and compare
 * against the most recent fetched snapshot on boot / whenever plugins request.
 */
export function useFeedUnread(): {
  count: number;
  items: FeedItem[];
  markSeen: () => void;
  refresh: () => Promise<void>;
} {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [lastSeen, setLastSeenState] = useState<number>(() => getLastSeen());

  const refresh = useCallback(async () => {
    try {
      const snapshot = await window.prepOS.feed.list();
      setItems(snapshot?.items ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markSeen = useCallback(() => {
    const ts = Date.now();
    setLastSeen(ts);
    setLastSeenState(ts);
  }, []);

  const count = items.filter((it) => (it.publishedAt ?? 0) > lastSeen).length;

  return { count, items, markSeen, refresh };
}
