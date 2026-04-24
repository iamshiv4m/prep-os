import { XMLParser } from "fast-xml-parser";
import type { FeedItem, FeedSnapshot, FeedSource } from "@shared/types";
import { getFeedCache, setFeedCache } from "./store.js";

export const FEED_SOURCES: FeedSource[] = [
  // ---- Interview / Career — beginner-friendly, India-strong sources ----
  // These three carry the bulk of placement-prep readers (DSA sheets,
  // company-wise problems, interview experiences). GfG's WordPress feed and
  // takeUforward's blog sit on standard /feed paths; InterviewBit publishes
  // long-form prep guides at /blog/feed/.
  {
    id: "geeksforgeeks",
    name: "GeeksforGeeks",
    icon: "🟢",
    homepage: "https://www.geeksforgeeks.org",
    rss: "https://www.geeksforgeeks.org/feed/",
    color: "#2f8d46",
    category: "career",
  },
  // takeUforward's site is Next.js with no first-party RSS, so we pull from
  // Striver's official YouTube channel (DSA series, company-wise problems,
  // interview experiences). YouTube exposes per-channel Atom feeds at the
  // /feeds/videos.xml endpoint — same parser path as our other Atom sources.
  {
    id: "takeuforward-yt",
    name: "Striver (YouTube)",
    icon: "🪜",
    homepage: "https://www.youtube.com/@takeUforward",
    rss: "https://www.youtube.com/feeds/videos.xml?channel_id=UCJskGeByzRRSvmOyZOz61ig",
    color: "#ff6b35",
    category: "career",
  },
  {
    id: "neetcode-yt",
    name: "NeetCode (YouTube)",
    icon: "🧩",
    homepage: "https://www.youtube.com/@NeetCode",
    rss: "https://www.youtube.com/feeds/videos.xml?channel_id=UC_mYaQAE6-71rjSN6CeCA-g",
    color: "#22c55e",
    category: "career",
  },
  {
    id: "interviewbit",
    name: "InterviewBit",
    icon: "💼",
    homepage: "https://www.interviewbit.com/blog/",
    rss: "https://www.interviewbit.com/blog/feed/",
    color: "#1d4ed8",
    category: "career",
  },
  {
    id: "freecodecamp",
    name: "freeCodeCamp",
    icon: "🏕️",
    homepage: "https://www.freecodecamp.org/news/",
    rss: "https://www.freecodecamp.org/news/rss/",
    color: "#0a0a23",
    category: "career",
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    icon: "🟠",
    homepage: "https://news.ycombinator.com",
    rss: "https://hacker-news.firebaseio.com/v0/topstories.json",
    color: "#ff6600",
    category: "general",
  },
  // GitHub Trending has no official RSS — we pull from the well-maintained
  // community mirror (mshibanami/GitHubTrendingRSS), which scrapes the same
  // /trending page GitHub renders. Falls into "general" so it doesn't pollute
  // the career bucket with random repos.
  {
    id: "github-trending",
    name: "GitHub Trending",
    icon: "🔥",
    homepage: "https://github.com/trending",
    rss: "https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml",
    color: "#f97316",
    category: "general",
  },
  {
    id: "dev-to",
    name: "DEV",
    icon: "👩‍💻",
    homepage: "https://dev.to",
    rss: "https://dev.to/feed",
    color: "#3b49df",
    category: "frontend",
  },
  {
    id: "css-tricks",
    name: "CSS-Tricks",
    icon: "🎨",
    homepage: "https://css-tricks.com",
    rss: "https://css-tricks.com/feed/",
    color: "#ff7b73",
    category: "frontend",
  },
  {
    id: "smashing",
    name: "Smashing Magazine",
    icon: "💥",
    homepage: "https://www.smashingmagazine.com",
    rss: "https://www.smashingmagazine.com/feed/",
    color: "#d33a2c",
    category: "frontend",
  },
  {
    id: "vercel-blog",
    name: "Vercel",
    icon: "▲",
    homepage: "https://vercel.com/blog",
    rss: "https://vercel.com/atom",
    color: "#ffffff",
    category: "frontend",
  },
  {
    id: "react-blog",
    name: "React",
    icon: "⚛️",
    homepage: "https://react.dev/blog",
    rss: "https://react.dev/rss.xml",
    color: "#58c4dc",
    category: "frontend",
  },
  {
    id: "web-dev",
    name: "web.dev",
    icon: "🌐",
    homepage: "https://web.dev",
    rss: "https://web.dev/feed.xml",
    color: "#4285f4",
    category: "frontend",
  },
  {
    id: "josh-comeau",
    name: "Josh Comeau",
    icon: "🧑‍🎨",
    homepage: "https://www.joshwcomeau.com",
    rss: "https://www.joshwcomeau.com/rss.xml",
    color: "#e879f9",
    category: "frontend",
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    icon: "🐙",
    homepage: "https://github.blog",
    rss: "https://github.blog/feed/",
    color: "#6e5494",
    category: "backend",
  },
  {
    id: "netflix-tech",
    name: "Netflix TechBlog",
    icon: "🎬",
    homepage: "https://netflixtechblog.com",
    rss: "https://netflixtechblog.com/feed",
    color: "#e50914",
    category: "backend",
  },
  {
    id: "cloudflare-blog",
    name: "Cloudflare",
    icon: "☁️",
    homepage: "https://blog.cloudflare.com",
    rss: "https://blog.cloudflare.com/rss/",
    color: "#f38020",
    category: "backend",
  },
  {
    id: "martin-fowler",
    name: "Martin Fowler",
    icon: "📐",
    homepage: "https://martinfowler.com",
    rss: "https://martinfowler.com/feed.atom",
    color: "#8b5cf6",
    category: "backend",
  },
  {
    id: "high-scalability",
    name: "High Scalability",
    icon: "📈",
    homepage: "https://highscalability.com",
    rss: "https://highscalability.com/rss.xml",
    color: "#10b981",
    category: "backend",
  },
  {
    id: "bytebytego",
    name: "ByteByteGo",
    icon: "🧩",
    homepage: "https://blog.bytebytego.com",
    rss: "https://blog.bytebytego.com/feed",
    color: "#f59e0b",
    category: "system-design",
  },
  {
    id: "infoq-architecture",
    name: "InfoQ Architecture",
    icon: "🏛️",
    homepage: "https://www.infoq.com/architecture-design/",
    rss: "https://feed.infoq.com/architecture-design/",
    color: "#2563eb",
    category: "system-design",
  },
  {
    id: "changelog",
    name: "Changelog",
    icon: "🎙️",
    homepage: "https://changelog.com",
    rss: "https://changelog.com/feed",
    color: "#fbbf24",
    category: "system-design",
  },
];

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_ITEMS_PER_SOURCE = 20;
const MAX_TOTAL_ITEMS = 200;
const HN_TOP_COUNT = 15;
const USER_AGENT = "PrepOS/0.1 (+https://github.com/shivamjha/prep-os)";

let inflight: Promise<FeedSnapshot> | null = null;

export function listFeedSources(): FeedSource[] {
  return FEED_SOURCES;
}

export async function getFeed(): Promise<FeedSnapshot> {
  const cached = getFeedCache();
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
    return cached;
  }
  return refreshAllFeeds();
}

export async function refreshAllFeeds(): Promise<FeedSnapshot> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const results = await Promise.allSettled(FEED_SOURCES.map(fetchSource));
      const items: FeedItem[] = [];
      const errors: Array<{ sourceId: string; message: string }> = [];
      results.forEach((res, idx) => {
        const source = FEED_SOURCES[idx];
        if (res.status === "fulfilled") {
          items.push(...res.value);
        } else {
          errors.push({ sourceId: source.id, message: errorMessage(res.reason) });
        }
      });
      items.sort((a, b) => b.publishedAt - a.publishedAt);
      const snapshot: FeedSnapshot = {
        items: items.slice(0, MAX_TOTAL_ITEMS),
        updatedAt: Date.now(),
        errors,
      };
      setFeedCache(snapshot);
      return snapshot;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

async function fetchSource(source: FeedSource): Promise<FeedItem[]> {
  if (source.id === "hacker-news") {
    return fetchHackerNews(source);
  }
  if (source.id === "github-trending") {
    // Primary: community RSS mirror (mshibanami). If it ever goes down or
    // returns garbage, fall back to scraping github.com/trending directly so
    // the marketing claim ("GitHub Trending") never silently breaks.
    try {
      const items = await fetchRss(source);
      if (items.length > 0) return items;
    } catch {
      // Swallow primary failure — we'll try the HTML fallback next.
    }
    return fetchGithubTrendingFallback(source);
  }
  return fetchRss(source);
}

/**
 * Fallback scraper for GitHub Trending. Parses the public /trending HTML —
 * the markup is stable enough that a small regex pass is more reliable than
 * pulling in a full HTML parser. Returns at most MAX_ITEMS_PER_SOURCE items.
 */
async function fetchGithubTrendingFallback(source: FeedSource): Promise<FeedItem[]> {
  const html = await fetchText("https://github.com/trending?since=daily", {
    Accept: "text/html",
  });
  const items: FeedItem[] = [];
  // Each repo lives in an <article class="Box-row"> block. Inside the block
  // we want the <a href="/owner/repo"> from the heading and the description
  // paragraph that follows. Use a non-greedy span match per article.
  const articleRe = /<article[^>]*class="[^"]*Box-row[^"]*"[\s\S]*?<\/article>/g;
  const linkRe = /<h2[^>]*class="[^"]*lh-condensed[^"]*"[\s\S]*?<a[^>]*href="\/([^/"]+)\/([^/"]+)"/;
  const descRe = /<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/;

  for (const block of html.match(articleRe) ?? []) {
    const link = block.match(linkRe);
    if (!link) continue;
    const owner = link[1];
    const repo = link[2];
    if (!owner || !repo || owner === "apps") continue;
    const url = `https://github.com/${owner}/${repo}`;
    const descMatch = block.match(descRe);
    const description = descMatch ? decodeEntities(stripTags(descMatch[1])).trim() : undefined;
    items.push({
      id: `${source.id}:${owner}/${repo}`,
      sourceId: source.id,
      title: `${owner}/${repo}`,
      url,
      description: description?.length ? description : undefined,
      // /trending lists daily/weekly winners — use "now" as published since the
      // page itself doesn't expose a per-repo timestamp.
      publishedAt: Date.now(),
    });
    if (items.length >= MAX_ITEMS_PER_SOURCE) break;
  }
  return items;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRss(source: FeedSource): Promise<FeedItem[]> {
  const xml = await fetchText(source.rss, {
    Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.5",
  });
  return parseRss(xml, source.id);
}

async function fetchHackerNews(source: FeedSource): Promise<FeedItem[]> {
  const idsJson = await fetchText(source.rss, { Accept: "application/json" });
  const ids = (JSON.parse(idsJson) as number[]).slice(0, HN_TOP_COUNT);
  const stories = await Promise.all(
    ids.map((id) =>
      fetchText(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
        Accept: "application/json",
      })
        .then((raw) => JSON.parse(raw) as HnStory | null)
        .catch(() => null),
    ),
  );
  const items: FeedItem[] = [];
  for (const story of stories) {
    if (!story || story.dead || story.deleted) continue;
    const url = story.url ?? `https://news.ycombinator.com/item?id=${story.id}`;
    const title = story.title?.trim();
    if (!title || !url) continue;
    items.push({
      id: `${source.id}:${story.id}`,
      sourceId: source.id,
      title,
      url,
      description: story.score
        ? `${story.score} points · ${story.descendants ?? 0} comments`
        : undefined,
      author: story.by,
      publishedAt: (story.time ?? Math.floor(Date.now() / 1000)) * 1000,
    });
  }
  return items;
}

interface HnStory {
  id: number;
  by?: string;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
  time?: number;
  dead?: boolean;
  deleted?: boolean;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
  processEntities: true,
  cdataPropName: "__cdata",
});

type XmlValue = string | number | boolean | null | undefined | XmlNode | XmlValue[];
interface XmlNode {
  [key: string]: XmlValue;
}

export function parseRss(xml: string, sourceId: string): FeedItem[] {
  const parsed = parser.parse(xml) as XmlNode;
  const items: FeedItem[] = [];

  const rss = parsed.rss as XmlNode | undefined;
  if (rss?.channel) {
    const channel = rss.channel as XmlNode;
    const rawItems = asArray(channel.item);
    for (const raw of rawItems) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const item = raw as XmlNode;
      const title = pickText(item.title);
      const link = pickText(item.link);
      if (!title || !link) continue;
      const pub = pickText(item.pubDate) ?? pickText(item.date);
      const description = pickText(item.description) ?? pickText(item["content:encoded"]);
      const author =
        pickText(item.author) ?? pickText(item["dc:creator"]) ?? pickText(item.creator);
      items.push({
        id: `${sourceId}:${stableHash(link)}`,
        sourceId,
        title: decodeEntities(title),
        url: link,
        description: description ? summarize(description) : undefined,
        author: author ? decodeEntities(author) : undefined,
        publishedAt: parseDate(pub),
      });
    }
  }

  const atom = parsed.feed as XmlNode | undefined;
  if (atom?.entry) {
    const entries = asArray(atom.entry);
    for (const raw of entries) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const entry = raw as XmlNode;
      const title = pickText(entry.title);
      const link = pickAtomLink(entry.link);
      if (!title || !link) continue;
      const pub = pickText(entry.updated) ?? pickText(entry.published);
      const description = pickText(entry.summary) ?? pickText(entry.content);
      const author = pickAtomAuthor(entry.author);
      items.push({
        id: `${sourceId}:${stableHash(link)}`,
        sourceId,
        title: decodeEntities(title),
        url: link,
        description: description ? summarize(description) : undefined,
        author: author ? decodeEntities(author) : undefined,
        publishedAt: parseDate(pub),
      });
    }
  }

  return items.slice(0, MAX_ITEMS_PER_SOURCE);
}

function asArray(node: XmlValue): XmlValue[] {
  if (node === undefined || node === null) return [];
  return Array.isArray(node) ? node : [node];
}

function pickText(node: XmlValue): string | undefined {
  if (node === undefined || node === null) return undefined;
  if (typeof node === "string") return node.trim() || undefined;
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  if (Array.isArray(node)) {
    for (const entry of node) {
      const val = pickText(entry);
      if (val) return val;
    }
    return undefined;
  }
  const obj = node as XmlNode;
  const cdata = obj.__cdata;
  if (typeof cdata === "string" && cdata.trim()) return cdata.trim();
  const text = obj["#text"];
  if (typeof text === "string" && text.trim()) return text.trim();
  if (typeof text === "number") return String(text);
  return undefined;
}

function pickAtomLink(node: XmlValue): string | undefined {
  if (!node) return undefined;
  const arr = asArray(node);
  let fallback: string | undefined;
  for (const raw of arr) {
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const obj = raw as XmlNode;
    const href = obj["@_href"];
    const rel = obj["@_rel"];
    if (typeof href !== "string" || !href) continue;
    if (rel === undefined || rel === "alternate") return href;
    fallback ??= href;
  }
  return fallback;
}

function pickAtomAuthor(node: XmlValue): string | undefined {
  if (!node) return undefined;
  const first = asArray(node)[0];
  if (!first) return undefined;
  if (typeof first === "string") return first;
  if (typeof first !== "object" || Array.isArray(first)) return undefined;
  const obj = first as XmlNode;
  return pickText(obj.name) ?? pickText(obj);
}

function parseDate(value: string | undefined): number {
  if (!value) return Date.now();
  const ts = Date.parse(value);
  if (Number.isFinite(ts)) return ts;
  return Date.now();
}

function summarize(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const decoded = decodeEntities(stripped);
  return decoded.length > 280 ? `${decoded.slice(0, 279).trimEnd()}…` : decoded;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
  "#x27": "'",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity in ENTITIES) return ENTITIES[entity];
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (entity.startsWith("#")) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return match;
  });
}

function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

async function fetchText(url: string, headers: Record<string, string>): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, ...headers },
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
