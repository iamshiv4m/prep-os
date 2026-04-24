export type SDDifficulty = "easy" | "medium" | "hard" | "staff";

export type SDTopic =
  | "messaging"
  | "search"
  | "storage"
  | "feed"
  | "geo"
  | "video"
  | "payments"
  | "realtime"
  | "data"
  | "ml"
  | "infra";

export interface SDQuestion {
  id: string;
  title: string;
  difficulty: SDDifficulty;
  topics: SDTopic[];
  /** Common asker companies — purely informational. */
  company?: string[];
  /** 1–2 sentence problem statement. */
  summary: string;
  /** 3–6 functional requirements. */
  requirements: string[];
  /** 3–6 non-functional requirements (scale, latency, consistency, durability). */
  nonFunctional: string[];
  /** 3–5 hint bullets — what to think about when designing. */
  hints: string[];
  /** Optional 1–3 external readings. Only well-known, real URLs. */
  references?: Array<{ label: string; url: string }>;
}

export const SYSTEM_DESIGN_QUESTIONS: SDQuestion[] = [
  {
    id: "url-shortener",
    title: "Design a URL Shortener (e.g. bit.ly)",
    difficulty: "medium",
    topics: ["storage", "infra"],
    company: ["Amazon", "Microsoft", "Google"],
    summary:
      "Build a service that takes a long URL and returns a short alias. Visiting the alias 301-redirects to the original URL.",
    requirements: [
      "Generate a short, unique alias for any submitted long URL",
      "Redirect from the short alias to the original URL with low latency",
      "Allow optional custom aliases that the user picks",
      "Track basic per-link analytics: clicks, country, referrer",
      "Support TTL / expiration on links",
    ],
    nonFunctional: [
      "Read-heavy workload: ~100:1 reads to writes",
      "P99 redirect latency < 50 ms globally",
      "Aliases must be globally unique and never collide",
      "Very high availability (99.99%) — links are referenced from emails / chats",
      "Durable: links must not be lost",
    ],
    hints: [
      "Compare base62 of an auto-increment counter vs. hashing the URL + collision check",
      "Use a counter range allocator (Zookeeper / DB token bucket) for distributed ID generation",
      "Cache hot aliases in Redis / a CDN edge to absorb the read load",
      "Treat the redirect path as the only synchronous path — push analytics to Kafka and consume async",
    ],
    references: [
      { label: "ByteByteGo: URL Shortener", url: "https://bytebytego.com/courses/system-design-interview/design-a-url-shortener" },
      { label: "Hello Interview: URL Shortener", url: "https://www.hellointerview.com/learn/system-design/answer-keys/bitly" },
    ],
  },
  {
    id: "twitter-timeline",
    title: "Design Twitter / Threads timeline",
    difficulty: "hard",
    topics: ["feed", "storage", "realtime"],
    company: ["Meta", "Twitter", "LinkedIn"],
    summary:
      "Design the home timeline for a Twitter-like product. Users post short messages and see a chronologically ordered (or ranked) feed of posts from people they follow.",
    requirements: [
      "Post a tweet (≤ 280 chars, optional media)",
      "Follow / unfollow users",
      "Render the home timeline of the most recent N tweets from followees",
      "Support reposts / quote tweets and basic engagement counters",
      "Notify followers in near-real-time when a celebrity they follow tweets",
    ],
    nonFunctional: [
      "Hundreds of millions of DAU; ~5,000 tweets/sec peak globally",
      "P99 timeline read < 200 ms",
      "Eventual consistency is acceptable for likes/RT counters",
      "Hot users (celebrities with 100M+ followers) cannot fan-out on write naively",
      "Fan-out must survive bursts — the World Cup tweet problem",
    ],
    hints: [
      "Hybrid push/pull fan-out: push tweets into followers' timelines for normal users, pull at read time for celebrities",
      "Per-user timeline cache in Redis as a capped sorted set keyed by tweet timestamp",
      "Decouple write path with Kafka so the API stays fast even when fan-out is slow",
      "Shard tweets by tweet_id (snowflake-style) and users by user_id; never join across shards in the hot path",
    ],
    references: [
      { label: "High Scalability: Twitter", url: "https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/" },
      { label: "ByteByteGo: News Feed", url: "https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system" },
    ],
  },
  {
    id: "instagram",
    title: "Design Instagram (photo & video sharing)",
    difficulty: "hard",
    topics: ["storage", "feed", "video"],
    company: ["Meta", "Snap", "Pinterest"],
    summary:
      "Design a service where users upload photos and short videos, follow other users, and consume a personalized feed of media.",
    requirements: [
      "Upload photos and short videos with captions and tags",
      "Generate multiple sizes / thumbnails server-side",
      "Render a chronological + ranked feed of followees' posts",
      "Like, comment, and bookmark posts",
      "Search by hashtag and username",
    ],
    nonFunctional: [
      "Storage is the dominant cost — petabytes of media",
      "Reads vastly outnumber writes; CDN cache hit ratio drives cost",
      "Eventual consistency on counters is fine, but uploads must be durable",
      "Mobile-first: payloads should be range-requestable and progressive",
      "P95 image load < 300 ms on 4G",
    ],
    hints: [
      "Object storage (S3 / GCS) for media + a small relational record per post; never put binary in the DB",
      "Pre-compute multiple resolutions on upload via a worker pool",
      "Use a global CDN with per-user signed URLs for private accounts",
      "Feed ranking sits on top of a candidate set produced by fan-out — split candidate generation from scoring",
    ],
    references: [
      { label: "Instagram Engineering: Storing Hundreds of Millions of Photos", url: "https://instagram-engineering.com/" },
    ],
  },
  {
    id: "whatsapp",
    title: "Design WhatsApp / Messaging",
    difficulty: "hard",
    topics: ["messaging", "realtime"],
    company: ["Meta", "Slack", "Discord"],
    summary:
      "Design a 1:1 and group chat system that delivers messages reliably and in order, including delivery / read receipts and offline support.",
    requirements: [
      "Send and receive 1:1 and group text messages",
      "Show sent / delivered / read receipts",
      "Push notifications when the recipient's app is closed",
      "Sync history when a user installs the app on a new device",
      "Optional end-to-end encryption (Signal protocol)",
    ],
    nonFunctional: [
      "P99 message delivery < 500 ms when both parties are online",
      "Exactly-once user-visible delivery; no duplicates after reconnect",
      "Strong per-conversation ordering",
      "Tens of millions of concurrent persistent connections",
      "Group fan-out should not block the sender",
    ],
    hints: [
      "Persistent WebSocket / MQTT gateways sharded by user_id with a session registry in Redis",
      "Message sequence numbers per conversation, not per sender, give the strongest ordering guarantee",
      "Outbox pattern: persist message → enqueue fan-out → ack to sender, all in one transaction",
      "Use APNs / FCM for push when the socket is gone; keep a small per-user 'unread' counter for badge sync",
    ],
    references: [
      { label: "High Scalability: WhatsApp Architecture", url: "https://highscalability.com/the-whatsapp-architecture-facebook-bought-for-19-billion/" },
      { label: "Hello Interview: WhatsApp", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp" },
    ],
  },
  {
    id: "uber",
    title: "Design Uber / Ola ride matching",
    difficulty: "hard",
    topics: ["geo", "realtime"],
    company: ["Uber", "Lyft", "DoorDash"],
    summary:
      "Match riders to nearby drivers in real time, route the trip, and handle live driver location updates.",
    requirements: [
      "Riders request a ride and see ETAs of nearby drivers",
      "System matches a rider to the best available driver within seconds",
      "Live location updates flow from driver phones to the rider's screen",
      "Compute fare based on distance, time, surge multiplier",
      "Persist trip records for billing and disputes",
    ],
    nonFunctional: [
      "P99 match time < 5s in dense cities",
      "Driver location heartbeats: ~1 message/sec/driver, hundreds of thousands concurrent",
      "Matching must be fair — a long-waiting driver should not be starved",
      "Geo queries must scale linearly with city density",
      "All money-touching paths require strong consistency",
    ],
    hints: [
      "Index driver locations using a geohash / S2 / H3 grid; query the rider's cell + neighbors",
      "Decouple location ingestion (Kafka, write-optimized) from match queries (Redis, read-optimized)",
      "Run matching as a per-cell single-threaded loop to avoid double-booking",
      "Surge pricing is a separate signal computed from supply/demand per cell, not per request",
    ],
    references: [
      { label: "Uber Engineering: H3", url: "https://www.uber.com/blog/h3/" },
      { label: "ByteByteGo: Proximity Service", url: "https://bytebytego.com/courses/system-design-interview/proximity-service" },
    ],
  },
  {
    id: "netflix",
    title: "Design Netflix / video streaming",
    difficulty: "staff",
    topics: ["video", "storage"],
    company: ["Netflix", "Disney+", "Hotstar"],
    summary:
      "Stream long-form video to tens of millions of concurrent viewers across devices, networks, and regions.",
    requirements: [
      "Browse a catalog of titles with metadata, artwork, trailers",
      "Adaptive bitrate playback that adjusts to bandwidth in flight",
      "Resume from last watched position across devices",
      "Personalized homepage / recommendations",
      "DRM-protected delivery to licensed devices",
    ],
    nonFunctional: [
      "Tens of Tbps of egress at peak; CDN economics dominate",
      "Sub-second startup time, sub-100ms seek",
      "Catalog is read-mostly; recs are personalized but tolerate minutes of staleness",
      "Resilient to single-region cloud failures",
      "Strict SLA for paid subscribers — failovers must be invisible",
    ],
    hints: [
      "Pre-encode each title into an HLS / DASH ladder of bitrates and push to a privately-operated CDN (Open Connect)",
      "Place CDN caches inside ISPs to avoid transit costs and improve startup time",
      "Personalization is a separate offline pipeline that materializes per-user homepages overnight + nudges in real time",
      "Microservices behind an API gateway; failover regions hold standby caches but not full state",
    ],
    references: [
      { label: "Netflix TechBlog", url: "https://netflixtechblog.com/" },
      { label: "Open Connect overview", url: "https://openconnect.netflix.com/" },
    ],
  },
  {
    id: "youtube",
    title: "Design YouTube",
    difficulty: "staff",
    topics: ["video", "storage", "search"],
    company: ["Google", "Meta", "TikTok"],
    summary:
      "Allow anyone to upload a video, transcode it for many devices, store it durably, and stream it on demand worldwide.",
    requirements: [
      "Upload videos of varying length and format (resumable)",
      "Transcode into multiple resolutions and codecs",
      "Stream adaptively across devices (mobile, TV, web)",
      "Search the catalog by title, channel, transcript",
      "Comments, likes, view counters, channel subscriptions",
    ],
    nonFunctional: [
      "Storage growth dominates; cold media must move to cheaper tiers automatically",
      "View counts must be high-throughput but not lose updates",
      "Global edge cache hit rate > 90% on hot content",
      "Search index lag should be minutes, not hours, for new uploads",
      "Multi-region durability for original master files",
    ],
    hints: [
      "Tiered storage: hot (SSD), warm (HDD), cold (object storage / tape)",
      "Per-bitrate manifest on a CDN; keep metadata (title, description, owner) in a separate scalable store",
      "View counts via a sketch (HyperLogLog) + periodic flush to canonical counter",
      "Search: ingest → tokenize → push to inverted index (Elasticsearch / Vespa) with near-real-time refresh",
    ],
    references: [
      { label: "Hello Interview: YouTube", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/youtube" },
    ],
  },
  {
    id: "dropbox",
    title: "Design Dropbox / Google Drive",
    difficulty: "hard",
    topics: ["storage", "data"],
    company: ["Dropbox", "Google", "Microsoft"],
    summary:
      "Sync files across multiple devices for the same user, with sharing, versioning, and offline editing.",
    requirements: [
      "Two-way sync between desktop / mobile and the cloud",
      "Detect conflicting edits and surface them to the user",
      "Share a file or folder with read or read/write permission",
      "Maintain version history with the ability to restore",
      "Efficient delta sync of large files (don't re-upload the whole file)",
    ],
    nonFunctional: [
      "Bandwidth efficiency is critical — most users are on residential links",
      "Strong consistency on permissions; eventual on view metadata is OK",
      "Years-long retention; durability over latency",
      "Petabyte scale; dedup across users where legally allowed",
      "End-to-end checksums on every block",
    ],
    hints: [
      "Split files into fixed-size blocks (e.g. 4 MiB), hash each, only upload missing blocks (content-defined chunking is even better)",
      "Metadata DB (file tree, permissions, version log) is separate from the block store",
      "Long-poll / WebSocket from clients to the metadata service for real-time sync notifications",
      "Conflict resolution: keep both versions, name them with the device ID — let the user pick",
    ],
    references: [
      { label: "Dropbox Tech Blog: Magic Pocket", url: "https://dropbox.tech/infrastructure" },
    ],
  },
  {
    id: "web-crawler",
    title: "Design Google Search / Web Crawler",
    difficulty: "staff",
    topics: ["search", "data", "infra"],
    company: ["Google", "Bing", "DuckDuckGo"],
    summary:
      "Crawl the public web, build an inverted index of its content, and serve sub-second relevance-ranked search results.",
    requirements: [
      "Discover new URLs and re-crawl known ones at appropriate frequencies",
      "Respect robots.txt and crawl-delay; behave politely per host",
      "Parse HTML, extract text, links, structured data",
      "Build an inverted index keyed by terms",
      "Serve ranked results in < 200 ms",
    ],
    nonFunctional: [
      "Tens of billions of pages; index size in tens of TB compressed",
      "Crawl throughput limited by per-host politeness, not raw bandwidth",
      "Index freshness: news in minutes, evergreen pages in days",
      "Query QPS in the tens of thousands at peak",
      "Defenses against spider traps, infinite calendars, soft 404s",
    ],
    hints: [
      "URL frontier as a priority queue per host; dedup with a Bloom filter / RocksDB before enqueuing",
      "Two indices: a frequently-rebuilt 'hot' shard for fresh content, a rarely-rebuilt 'cold' shard for the bulk",
      "Sharded inverted index by term hash; query nodes scatter-gather and merge top-K",
      "Ranking is a separate offline pipeline (PageRank-like graph + ML model) materialized into per-doc scores",
    ],
    references: [
      { label: "Google Research: The Anatomy of a Search Engine", url: "http://infolab.stanford.edu/~backrub/google.html" },
    ],
  },
  {
    id: "typeahead",
    title: "Design Typeahead / Autocomplete",
    difficulty: "medium",
    topics: ["search"],
    company: ["Google", "Amazon", "LinkedIn"],
    summary:
      "Suggest the top K query completions as the user types a prefix, ranked by popularity and personalization.",
    requirements: [
      "Return up to 10 suggestions for any prefix in < 100 ms",
      "Rank by global popularity and recency",
      "Personalize when a user is signed in",
      "Handle typos with fuzzy matching",
      "Filter inappropriate / unsafe completions",
    ],
    nonFunctional: [
      "Read-mostly; index updates can be batched hourly",
      "P99 latency < 100 ms including network",
      "Cache hit ratio > 90% on hot prefixes",
      "Suggestion list must be deterministic for the same input within a session",
    ],
    hints: [
      "Trie / prefix tree with each node carrying the top-K completions precomputed",
      "Fuzzy matching with a small Levenshtein automaton on top of the trie",
      "Personalization is a re-rank step: fetch global top-K, then re-score with user features",
      "Refresh the trie offline from query logs; avoid editing it under load",
    ],
    references: [
      { label: "ByteByteGo: Search Autocomplete", url: "https://bytebytego.com/courses/system-design-interview/design-a-search-autocomplete-system" },
    ],
  },
  {
    id: "rate-limiter",
    title: "Design a Rate Limiter",
    difficulty: "medium",
    topics: ["infra"],
    company: ["Stripe", "Cloudflare", "AWS"],
    summary:
      "Limit how many requests a client can make to an API in a given time window across a distributed fleet of servers.",
    requirements: [
      "Per-user, per-IP, and per-API-key limits",
      "Different limits per endpoint and HTTP method",
      "Return 429 with a Retry-After header on rejection",
      "Shared limit across all server instances of the API",
      "Optional burst allowance on top of a sustained rate",
    ],
    nonFunctional: [
      "Sub-millisecond decision time on the request hot path",
      "Survive a Redis / coordinator outage without blocking traffic (fail open vs. closed is a design choice)",
      "Accurate enough for billing but cheap enough to deploy on every request",
      "Memory footprint scales with active users, not total users",
    ],
    hints: [
      "Compare token bucket, leaky bucket, fixed window, sliding window log, and sliding window counter — know the trade-offs cold",
      "Use Redis with INCR + EXPIRE for fixed window; use a Lua script to make sliding window atomic",
      "Push the decision to the edge (envoy / nginx) when per-endpoint limits are coarse",
      "Embed a small in-process cache that lets through the first N requests while waiting for Redis to reply",
    ],
    references: [
      { label: "Cloudflare blog: Rate limiting at the edge", url: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/" },
      { label: "ByteByteGo: Rate Limiter", url: "https://bytebytego.com/courses/system-design-interview/design-a-rate-limiter" },
    ],
  },
  {
    id: "distributed-cache",
    title: "Design a Distributed Cache",
    difficulty: "hard",
    topics: ["infra", "storage"],
    company: ["Amazon", "Netflix", "Meta"],
    summary:
      "Build a horizontally-scaled in-memory key-value cache used by many services to absorb DB load.",
    requirements: [
      "GET / SET / DELETE with optional TTL",
      "Scale by adding nodes without rehashing the whole keyspace",
      "Replicate hot keys for fault tolerance",
      "Eviction policy — LRU at minimum, configurable",
      "Optional persistence (RDB-style snapshots) for warm starts",
    ],
    nonFunctional: [
      "Sub-millisecond GET latency",
      "Throughput in the millions of ops/sec per cluster",
      "Resilient to single-node failure with no data-path interruption",
      "Memory-efficient: avoid per-key overhead > 100 bytes",
      "Operable: rolling restarts must not blow the cache cold",
    ],
    hints: [
      "Consistent hashing with virtual nodes to spread keys evenly and minimize churn on rebalance",
      "Replicate each shard primary→replica synchronously for hot keys, async for cold",
      "Client-side hashing avoids a coordinator on the hot path",
      "Multi-tier cache: small per-process LRU on top of the distributed cache to cut network round-trips",
    ],
    references: [
      { label: "ByteByteGo: Distributed Cache", url: "https://bytebytego.com/courses/system-design-interview/design-a-key-value-store" },
    ],
  },
  {
    id: "notifications",
    title: "Design a Notification Service",
    difficulty: "medium",
    topics: ["messaging"],
    company: ["Meta", "Uber", "Pinterest"],
    summary:
      "Deliver notifications (push, SMS, email, in-app) to users on behalf of many product surfaces, with user preferences and dedup.",
    requirements: [
      "Accept notify requests from N upstream services with a typed schema",
      "Render each notification per channel (push / email / SMS / in-app)",
      "Honor per-user preferences and quiet hours",
      "Dedup so a user isn't pinged twice for the same event",
      "Track delivery status and surface failures back to the sender",
    ],
    nonFunctional: [
      "Bursty: a single news event can trigger millions of pushes",
      "Per-channel SLAs differ: push is real-time, email tolerates minutes",
      "Idempotent ingestion — upstreams will retry",
      "Comply with regional regulations (GDPR, TCPA, opt-in lists)",
    ],
    hints: [
      "Two stages: ingestion + dedup queue, then per-channel worker pools that talk to APNs / FCM / SES / Twilio",
      "Preferences service is its own bounded context with caching — never re-fetch on the hot path",
      "Templating service renders strings server-side; senders never construct human text",
      "Dead-letter queue per channel for failed deliveries; rehydrate during incidents",
    ],
    references: [
      { label: "ByteByteGo: Notification System", url: "https://bytebytego.com/courses/system-design-interview/design-a-notification-system" },
    ],
  },
  {
    id: "news-feed",
    title: "Design a News Feed (Facebook-style)",
    difficulty: "hard",
    topics: ["feed", "ml"],
    company: ["Meta", "LinkedIn", "Pinterest"],
    summary:
      "Build the personalized News Feed: ingest activity from friends/pages, score it, and serve a ranked stream of the most relevant posts.",
    requirements: [
      "Ingest posts, comments, likes, shares from friends and followed pages",
      "Generate a per-user candidate set whenever the feed is fetched",
      "Rank candidates by predicted user engagement",
      "Inject ads at controlled positions",
      "Refresh seamlessly with pull-to-refresh and infinite scroll",
    ],
    nonFunctional: [
      "Multiple Bs of feed reads/day; very read-heavy",
      "P95 feed render < 500 ms on mobile",
      "Eventual consistency on counts is fine",
      "Ranking model must be re-deployable without a feed outage",
      "Cap memory per active user — not every user is online at once",
    ],
    hints: [
      "Hybrid push/pull (same as Twitter): pre-build feeds for active users, compute on demand for the rest",
      "Two-stage ranking: cheap candidate generator → expensive deep model on the top few hundred",
      "Feature store keyed by (user_id, post_id) feeds the ranker; precompute features at write time",
      "A/B test framework is non-negotiable — every change ships behind a flag with metrics",
    ],
    references: [
      { label: "ByteByteGo: News Feed", url: "https://bytebytego.com/courses/system-design-interview/design-a-news-feed-system" },
    ],
  },
  {
    id: "stock-exchange",
    title: "Design a Stock Exchange / Matching Engine",
    difficulty: "staff",
    topics: ["payments", "realtime", "data"],
    company: ["Citadel", "Jane Street", "Coinbase"],
    summary:
      "Run an order book that matches buy and sell limit orders for a financial instrument with strict ordering, audit, and ultra-low latency.",
    requirements: [
      "Accept limit and market orders, cancel and modify orders",
      "Maintain a per-symbol order book and produce matches",
      "Publish public market data (top of book, trades) to subscribers",
      "Persist every event to an immutable audit log",
      "Risk checks (position, capital) before an order touches the book",
    ],
    nonFunctional: [
      "P99 match latency in single-digit microseconds",
      "Strict per-symbol time priority; matching must be deterministic",
      "Hot failover with zero data loss — sequencer-replica model",
      "Throughput in the millions of msgs/sec per symbol cluster",
      "Regulatory durability — every order, even cancelled, retained for years",
    ],
    hints: [
      "Single-threaded per-symbol matching loop — concurrency is solved by sharding by symbol, not by locks",
      "Sequencer pattern: one process assigns the canonical order; replicas tail its log",
      "Kernel bypass networking (DPDK, Solarflare) when the budget is microseconds",
      "Write the audit log before the engine touches the order — your future regulator will thank you",
    ],
    references: [
      { label: "LMAX Disruptor", url: "https://lmax-exchange.github.io/disruptor/" },
    ],
  },
  {
    id: "payment-system",
    title: "Design a Payment System",
    difficulty: "hard",
    topics: ["payments"],
    company: ["Stripe", "Square", "PayPal"],
    summary:
      "Process card payments end to end: authorize, capture, refund, dispute, and reconcile against banking partners.",
    requirements: [
      "Authorize a card with a PSP / card network and capture funds",
      "Refund full or partial amounts on a previous capture",
      "Handle webhooks from networks for async events (chargebacks, settlements)",
      "Idempotent retries on every external call",
      "Maintain a double-entry ledger of every state change",
    ],
    nonFunctional: [
      "PCI DSS scope must be minimized — never let card data touch internal services",
      "Exactly-once semantics on captures (no double charges)",
      "Strong consistency on balances; eventual is fine on dashboards",
      "Auditable: a regulator can replay the ledger and reconstruct any account",
      "Multi-region: tolerate region failure without losing in-flight authorizations",
    ],
    hints: [
      "Idempotency keys on every public API; persist them with the response, not just the request",
      "State-machine per payment: authorized → captured → refunded → disputed; transitions are append-only",
      "Double-entry ledger: debit/credit pairs that always sum to zero — this catches bugs reconciliation can't",
      "Retries via a durable outbox; never sleep+retry in-process for an external charge",
    ],
    references: [
      { label: "Stripe Engineering: Idempotency", url: "https://stripe.com/blog/idempotency" },
      { label: "ByteByteGo: Payment System", url: "https://bytebytego.com/courses/system-design-interview/design-a-payment-system" },
    ],
  },
  {
    id: "live-streaming",
    title: "Design Live Streaming / Twitch",
    difficulty: "staff",
    topics: ["video", "realtime"],
    company: ["Twitch", "YouTube", "Meta"],
    summary:
      "Ingest a live video stream from a broadcaster, transcode in real time, and deliver low-latency to many simultaneous viewers with chat.",
    requirements: [
      "Broadcaster ingests via RTMP / SRT / WebRTC",
      "Transcode the source stream into a ladder of bitrates",
      "Deliver to viewers with <5s glass-to-glass latency for normal mode, <1s for low-latency mode",
      "Real-time chat alongside the video",
      "Record the stream as a VOD when the broadcast ends",
    ],
    nonFunctional: [
      "Tens of thousands of viewers per popular stream — fan-out via CDN required",
      "Transcode pipeline must keep up in real time; lagging = the stream is broken",
      "Chat must scale to channels with 100k+ concurrent viewers",
      "Resilient to broadcaster network blips; auto-reconnect without restarting the stream",
    ],
    hints: [
      "Ingest tier (RTMP) → transcode farm → packager → CDN; each tier scales independently",
      "Use HLS / LL-HLS / WebRTC depending on the latency / scale trade-off",
      "Chat: sharded WebSocket gateways per channel with a fan-out hub; coalesce messages when bursting",
      "Record by tee'ing the source segment into object storage in parallel with packaging — never re-encode at end",
    ],
    references: [
      { label: "Twitch Blog", url: "https://blog.twitch.tv/" },
    ],
  },
  {
    id: "recommendation-system",
    title: "Design a Recommendation System",
    difficulty: "hard",
    topics: ["ml", "data", "feed"],
    company: ["Netflix", "Spotify", "Amazon"],
    summary:
      "Recommend items (videos, products, songs) to users based on their behavior and similar users' behavior, served at scale.",
    requirements: [
      "Generate top-K recommendations per user across multiple surfaces",
      "Cold-start handling for brand-new users and brand-new items",
      "Explain or label recommendations ('Because you watched X')",
      "Feedback loop: ingest impressions, clicks, watch-time, ratings",
      "Refresh recommendations as user behavior changes",
    ],
    nonFunctional: [
      "Recommendation request latency < 100 ms",
      "Model retraining cadence: hours for behavioral, days for deep models",
      "Online predictions and offline batch generations both supported",
      "Fairness / diversity constraints — don't just optimize raw CTR",
      "Strict data lineage — a regulator can ask why a recommendation surfaced",
    ],
    hints: [
      "Two-stage architecture: candidate generation (cheap, recall-focused) → ranking (expensive, precision-focused)",
      "Embedding-based candidate generation (two-tower) lets you fetch top-K in O(log N) via ANN (FAISS / ScaNN)",
      "Feature store separates training-time and serving-time features and prevents skew",
      "Online learning for fast-moving signals (recent clicks) layered on top of slow batch models",
    ],
    references: [
      { label: "Netflix TechBlog: Recommendations", url: "https://netflixtechblog.com/" },
      { label: "Spotify Engineering", url: "https://engineering.atspotify.com/" },
    ],
  },
];
