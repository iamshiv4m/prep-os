import type { ContestItem, ContestPlatform, ContestSnapshot } from "@shared/types";
import { getContestsCache, setContestsCache } from "./store.js";

const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_TOTAL_ITEMS = 30;
const USER_AGENT = "PrepOS/0.1 (+https://github.com/shivamjha/prep-os)";

let inflight: Promise<ContestSnapshot> | null = null;

export async function getContests(): Promise<ContestSnapshot> {
  const cached = getContestsCache();
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
    return cached;
  }
  return refreshContests();
}

export async function refreshContests(): Promise<ContestSnapshot> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const cached = getContestsCache();
      const results = await Promise.allSettled([fetchCodeforces(), fetchLeetCode()]);
      const items: ContestItem[] = [];
      const errors: Array<{ platform: string; message: string }> = [];

      const platforms: ContestPlatform[] = ["codeforces", "leetcode"];
      results.forEach((res, idx) => {
        const platform = platforms[idx];
        if (res.status === "fulfilled") {
          items.push(...res.value);
        } else {
          errors.push({ platform, message: errorMessage(res.reason) });
        }
      });

      // If a platform errored, fold its previously-cached items back in so the
      // user doesn't suddenly see a partial list when (e.g.) LeetCode rate-limits.
      if (cached && errors.length > 0) {
        const failedPlatforms = new Set(errors.map((e) => e.platform));
        for (const item of cached.items) {
          if (failedPlatforms.has(item.platform) && !items.some((i) => i.id === item.id)) {
            items.push(item);
          }
        }
      }

      const now = Date.now();
      const upcoming = items
        .filter((it) => it.startsAt + it.durationMs > now)
        .sort((a, b) => a.startsAt - b.startsAt)
        .slice(0, MAX_TOTAL_ITEMS);

      const snapshot: ContestSnapshot = {
        items: upcoming,
        updatedAt: now,
        errors,
      };
      setContestsCache(snapshot);
      return snapshot;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface CodeforcesContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds?: number;
}

interface CodeforcesResponse {
  status: string;
  result?: CodeforcesContest[];
  comment?: string;
}

async function fetchCodeforces(): Promise<ContestItem[]> {
  const text = await fetchText(
    "https://codeforces.com/api/contest.list?gym=false",
    { Accept: "application/json" },
  );
  let parsed: CodeforcesResponse;
  try {
    parsed = JSON.parse(text) as CodeforcesResponse;
  } catch {
    throw new Error("Codeforces returned non-JSON response");
  }
  if (parsed.status !== "OK" || !Array.isArray(parsed.result)) {
    throw new Error(parsed.comment || `Codeforces status: ${parsed.status}`);
  }
  const items: ContestItem[] = [];
  for (const c of parsed.result) {
    if (c.phase !== "BEFORE") continue;
    if (typeof c.startTimeSeconds !== "number") continue;
    items.push({
      id: `codeforces:${c.id}`,
      platform: "codeforces",
      name: c.name,
      url: `https://codeforces.com/contests/${c.id}`,
      startsAt: c.startTimeSeconds * 1000,
      durationMs: c.durationSeconds * 1000,
      raw: c,
    });
  }
  return items;
}

interface LeetCodeContest {
  title: string;
  titleSlug: string;
  startTime: number;
  duration: number;
  originStartTime?: number;
  isVirtual?: boolean;
}

interface LeetCodeResponse {
  data?: {
    allContests?: LeetCodeContest[];
  };
  errors?: Array<{ message: string }>;
}

async function fetchLeetCode(): Promise<ContestItem[]> {
  const body = JSON.stringify({
    query: "{ allContests { title titleSlug startTime duration originStartTime isVirtual } }",
  });
  let text: string;
  try {
    text = await fetchText(
      "https://leetcode.com/graphql",
      {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      { method: "POST", body },
    );
  } catch (err) {
    // LeetCode is the most likely to flake (anti-bot HTML, rate limits, 5xx).
    // Fall back to the publicly known weekly + biweekly schedule so the widget
    // never shows an empty card just because one upstream had a hiccup.
    return computeLeetCodeFallback(errorMessage(err));
  }

  // LeetCode sometimes serves an HTML challenge page rather than JSON when it
  // suspects automation — detect that early and fall back to the schedule.
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("{")) {
    return computeLeetCodeFallback("LeetCode returned non-JSON response");
  }

  let parsed: LeetCodeResponse;
  try {
    parsed = JSON.parse(text) as LeetCodeResponse;
  } catch {
    return computeLeetCodeFallback("LeetCode returned malformed JSON");
  }
  const list = parsed.data?.allContests;
  if (!Array.isArray(list) || list.length === 0) {
    if (parsed.errors?.length) {
      throw new Error(parsed.errors.map((e) => e.message).join("; "));
    }
    return computeLeetCodeFallback("LeetCode contest list was empty");
  }

  const now = Date.now();
  const items: ContestItem[] = [];
  for (const c of list) {
    if (typeof c.startTime !== "number") continue;
    const startsAt = c.startTime * 1000;
    if (startsAt <= now) continue;
    items.push({
      id: `leetcode:${c.titleSlug}`,
      platform: "leetcode",
      name: c.title,
      url: `https://leetcode.com/contest/${c.titleSlug}`,
      startsAt,
      durationMs: c.duration * 1000,
      raw: c,
    });
  }
  return items;
}

/**
 * LeetCode's official cadence (as of 2024–2026):
 *  - Weekly Contest: every Sunday at 08:00 UTC, 1h 30m
 *  - Biweekly Contest: alternate Saturdays at 14:30 UTC, 1h 30m
 * We anchor the biweekly series to a known recent contest so parity stays
 * stable even if the user's clock drifts.
 */
function computeLeetCodeFallback(_reason: string): ContestItem[] {
  const DURATION_MS = 90 * 60 * 1000;
  const now = Date.now();
  const items: ContestItem[] = [];

  // Next 4 Sunday weekly contests at 08:00 UTC.
  for (let i = 0; i < 4; i += 1) {
    const start = nextWeeklySlot(now, /* dayOfWeek */ 0, /* utcHour */ 8, i);
    items.push({
      id: `leetcode:fallback-weekly-${start}`,
      platform: "leetcode",
      name: "LeetCode Weekly Contest",
      url: "https://leetcode.com/contest/",
      startsAt: start,
      durationMs: DURATION_MS,
    });
  }

  // Biweekly anchor: 2024-01-13 14:30 UTC was Biweekly Contest 121 (Saturday).
  // From that anchor, every 14 days is a biweekly slot.
  const anchor = Date.UTC(2024, 0, 13, 14, 30, 0);
  const stepMs = 14 * 24 * 60 * 60 * 1000;
  const stepsToNow = Math.ceil((now - anchor) / stepMs);
  for (let i = 0; i < 2; i += 1) {
    const start = anchor + (stepsToNow + i) * stepMs;
    if (start <= now) continue;
    items.push({
      id: `leetcode:fallback-biweekly-${start}`,
      platform: "leetcode",
      name: "LeetCode Biweekly Contest",
      url: "https://leetcode.com/contest/",
      startsAt: start,
      durationMs: DURATION_MS,
    });
  }

  return items;
}

/** Returns the timestamp (ms) of the n-th upcoming weekly slot at the given UTC weekday/hour. */
function nextWeeklySlot(now: number, dayOfWeek: number, utcHour: number, offsetWeeks: number): number {
  const d = new Date(now);
  const currentDay = d.getUTCDay();
  const daysAhead = (dayOfWeek - currentDay + 7) % 7;
  const candidate = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + daysAhead,
    utcHour,
    0,
    0,
  );
  // If today is the target day but the time is already past, jump to next week.
  let base = candidate;
  if (candidate <= now) {
    base = candidate + 7 * 24 * 60 * 60 * 1000;
  }
  return base + offsetWeeks * 7 * 24 * 60 * 60 * 1000;
}

interface FetchOptions {
  method?: string;
  body?: string;
}

async function fetchText(
  url: string,
  headers: Record<string, string>,
  options: FetchOptions = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers: { "User-Agent": USER_AGENT, ...headers },
      body: options.body,
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function errorMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return "Unknown error";
}
