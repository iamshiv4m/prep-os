import type { Tip, TipCategory } from "./types";

/**
 * Curated interview / career tips. Rotated daily via `tipForDay()`.
 *
 * Keep each tip short (1–2 sentences) and actionable. Add more over time;
 * `tipForDay()` deterministically picks one per day, so order doesn't matter.
 */
export const TIPS: readonly Tip[] = Object.freeze([
  // Coding / problem solving
  t(
    "c1",
    "coding",
    "Restate the problem first",
    "Before writing any code, restate the problem in your own words and list assumptions out loud. 40% of bombed interviews trace back to a misread prompt.",
  ),
  t(
    "c2",
    "coding",
    "Think in examples",
    "Always work through a small example by hand before coding. Include edge cases (empty, 1 element, duplicates) — they're usually where scoring points live.",
  ),
  t(
    "c3",
    "coding",
    "Brute force is a valid first step",
    "Articulate a brute force solution, state its complexity, and then say 'let's improve this'. Interviewers love seeing the improvement arc.",
  ),
  t(
    "c4",
    "coding",
    "Narrate your thinking",
    "Silence kills coding rounds. Even 'I'm thinking about whether a hashmap or two pointers fits here' is signal the interviewer needs.",
  ),
  t(
    "c5",
    "coding",
    "Time + space complexity, every time",
    "Whenever you finish coding, immediately state the time and space complexity. Don't wait to be asked.",
  ),
  t(
    "c6",
    "coding",
    "Test with intent, not randomness",
    "Walk through one happy path + one edge case + one stress case. Test by dry-running the code, not by squinting at it.",
  ),
  t(
    "c7",
    "coding",
    "Name things properly",
    "`tmp`, `x`, `data` are red flags. Rename on the fly — interviewers read your variables as a proxy for production code quality.",
  ),
  t(
    "c8",
    "coding",
    "Don't optimize prematurely",
    "Ship correct first, optimize second. A working O(n²) beats a broken O(n log n) every time.",
  ),
  t(
    "c9",
    "coding",
    "Sketch the data structure",
    "Before touching the editor, sketch the shape of your state. If it's a tree, draw it. If it's a graph, draw it. Your code will fall out of the picture.",
  ),
  t(
    "c10",
    "coding",
    "Recognize the pattern",
    "Sliding window, two pointers, BFS layer-by-layer, topo sort, union-find — 80% of coding rounds are one of ~15 patterns. Build the muscle to spot them in 30 seconds.",
  ),

  // System design
  t(
    "s1",
    "system-design",
    "Clarify, don't assume",
    "Spend the first 5 minutes asking about scale, read/write ratio, latency targets, and consistency needs. Design follows constraints.",
  ),
  t(
    "s2",
    "system-design",
    "Back of the envelope first",
    "Quick math: how many QPS? how much storage per day? how wide is the hot set? Numbers anchor every later tradeoff.",
  ),
  t(
    "s3",
    "system-design",
    "Start with the boring version",
    "A single service + one database handles more than you think. Add complexity only when a specific metric demands it.",
  ),
  t(
    "s4",
    "system-design",
    "Pick one consistency model and defend it",
    "Strong vs eventual is a choice, not a default. Name the boundary where you cross it and why.",
  ),
  t(
    "s5",
    "system-design",
    "Name the bottleneck before you scale",
    "Don't add a cache 'because caches are good'. Identify the bottleneck (hot key? cold read? N+1?) and size the fix.",
  ),
  t(
    "s6",
    "system-design",
    "Draw the write path before the read path",
    "Reads are usually easier. Get the write path, failure modes, and idempotency sorted first — reads fall out of that.",
  ),
  t(
    "s7",
    "system-design",
    "Know your storage tradeoffs",
    "SQL vs document vs KV vs wide-column isn't a religion — it's a fit. Be able to argue each in 30 seconds.",
  ),
  t(
    "s8",
    "system-design",
    "Talk about observability",
    "Metrics, logs, traces, alerts. A design that can't be debugged in prod isn't a design.",
  ),
  t(
    "s9",
    "system-design",
    "Mention failure explicitly",
    "'What happens if this node dies?' is a question you ask yourself before the interviewer does. Retries, timeouts, circuit breakers, dead-letter queues.",
  ),
  t(
    "s10",
    "system-design",
    "Draw boxes AND arrows",
    "Label every arrow with the protocol (HTTP, gRPC, Kafka topic) and data shape. Undefined arrows are where interviews unravel.",
  ),

  // Frontend specific
  t(
    "f1",
    "frontend",
    "Know the event loop cold",
    "Microtasks vs macrotasks, requestAnimationFrame, requestIdleCallback — explain the order a setTimeout + Promise + rAF would fire in.",
  ),
  t(
    "f2",
    "frontend",
    "Rendering ≠ reconciliation",
    "In React, 'renders' are function calls, not DOM writes. Get the vocabulary right and half of frontend perf questions become easy.",
  ),
  t(
    "f3",
    "frontend",
    "useMemo is not free",
    "Memoization has a cost. Default to plain values; memo only when a profiler says to.",
  ),
  t(
    "f4",
    "frontend",
    "List virtualization",
    "If you're rendering >200 rows, you should be virtualizing. Know what react-window / tanstack-virtual do under the hood.",
  ),
  t(
    "f5",
    "frontend",
    "CLS, LCP, INP",
    "Web Vitals aren't optional. Know what each means, typical offenders, and one concrete fix per metric.",
  ),
  t(
    "f6",
    "frontend",
    "Accessibility is hiring signal",
    "Keyboard nav, focus management, aria-live, label associations. Senior engineers are expected to mention these unprompted.",
  ),
  t(
    "f7",
    "frontend",
    "CSS containment & content-visibility",
    "Modern CSS has superpowers most candidates skip. `contain` and `content-visibility: auto` are easy differentiators.",
  ),
  t(
    "f8",
    "frontend",
    "Hydration is a trap",
    "Know the difference between streaming SSR, progressive hydration, islands, and RSC. 'Just use Next.js' isn't an answer.",
  ),
  t(
    "f9",
    "frontend",
    "Controlled vs uncontrolled",
    "For forms, controlled is simpler for small forms, uncontrolled (or a lib) scales better. Have a one-liner on when to switch.",
  ),
  t(
    "f10",
    "frontend",
    "Know the browser network primitives",
    "fetch, XHR, EventSource, WebSocket, WebRTC — what problem each solves and when to use which.",
  ),

  // Backend specific
  t(
    "b1",
    "backend",
    "Indexes are physical, not magical",
    "Every index adds write cost and storage. Be able to explain why adding 5 indexes 'because reads are slow' is often wrong.",
  ),
  t(
    "b2",
    "backend",
    "N+1 queries in your sleep",
    "Identify N+1 from a code snippet in <10 seconds. Know how to fix it with joins, `IN (...)`, or a dataloader.",
  ),
  t(
    "b3",
    "backend",
    "Idempotency keys",
    "Any non-GET endpoint that involves money, sends emails, or writes rows should have an idempotency story.",
  ),
  t(
    "b4",
    "backend",
    "Back pressure",
    "Unbounded queues are a time bomb. Always have an answer for 'what if the consumer is slower than the producer?'",
  ),
  t(
    "b5",
    "backend",
    "Use the right lock granularity",
    "Table lock → row lock → advisory lock → optimistic. Know the contention cost of each.",
  ),
  t(
    "b6",
    "backend",
    "Pagination > offset",
    "Cursor-based pagination beats offset for large tables. Be able to explain why (scan cost grows linearly with page number).",
  ),
  t(
    "b7",
    "backend",
    "Transactions end at the DB boundary",
    "A transaction spanning DB + Stripe + SQS doesn't exist. Outbox pattern, sagas, or two-phase commit — pick one and know it cold.",
  ),
  t(
    "b8",
    "backend",
    "Know your auth flow",
    "OAuth2, OIDC, JWT, session cookies, refresh tokens. If the role has any auth surface, expect a 10-min deep-dive.",
  ),
  t(
    "b9",
    "backend",
    "Timeouts at every hop",
    "'How long do you wait?' is a design question. Default timeouts exist at the client, proxy, server, and DB — all different.",
  ),
  t(
    "b10",
    "backend",
    "Read the query plan",
    "`EXPLAIN ANALYZE` is a senior-engineer skill. Practice reading a few real plans before your interview.",
  ),

  // Behavioral
  t(
    "bh1",
    "behavioral",
    "STAR, but tight",
    "Situation (1 sentence), Task (1 sentence), Action (3–5 sentences, you doing things), Result (1–2 sentences, ideally with numbers).",
  ),
  t(
    "bh2",
    "behavioral",
    "Prepare 6 stories, not 60",
    "A conflict story, a leadership story, a failure story, a tradeoff story, a cross-functional story, a customer-impact story. Most questions map to one of these six.",
  ),
  t(
    "bh3",
    "behavioral",
    "Own the failure",
    "Failures without lessons read as denial. End every failure story with 'what I do differently now'.",
  ),
  t(
    "bh4",
    "behavioral",
    "Quantify impact",
    "'Improved performance' is weak. '$-saving, latency, DAU, revenue, bug count' are strong. Keep a running doc of your own numbers.",
  ),
  t(
    "bh5",
    "behavioral",
    "Don't badmouth previous teams",
    "Even if they deserved it. Interviewers read it as a preview of how you'll talk about them in 2 years.",
  ),
  t(
    "bh6",
    "behavioral",
    "Interview is two-way",
    "Leave 5 min for your questions and make them real. 'What's the biggest unresolved tech debate on the team right now?' beats 'What's the culture like?'",
  ),
  t(
    "bh7",
    "behavioral",
    "Practice out loud",
    "Rehearse stories out loud, not in your head. You'll find the dead ends only when you speak them.",
  ),
  t(
    "bh8",
    "behavioral",
    "Tell one surprising thing",
    "Pick 1 story that's slightly non-obvious about you (an unusual side project, a weird constraint you solved, a volunteer gig). Memorability wins offers.",
  ),
  t(
    "bh9",
    "behavioral",
    "Conflict stories need a resolution",
    "'And then we didn't talk for 3 months' is not a story. Every conflict story needs a concrete action you took and what changed.",
  ),
  t(
    "bh10",
    "behavioral",
    "Pre-mortem the hard questions",
    "'Tell me about a time you disagreed with your manager' — if this question scares you, write the answer down today.",
  ),

  // Mindset
  t(
    "m1",
    "mindset",
    "Sleep > one more question",
    "The night before, sleep beats cramming. Your pattern-recognition degrades fast under sleep loss and that's 80% of coding interviews.",
  ),
  t(
    "m2",
    "mindset",
    "Rejection is signal, not verdict",
    "Most rejections are calibration noise (wrong level, wrong team, one off-day). Treat it as 'not this one' not 'not me'.",
  ),
  t(
    "m3",
    "mindset",
    "Batch applications",
    "Apply to 10–20 companies in a 2-week window. Interview skill is perishable; batching lets you warm up before your dream offer.",
  ),
  t(
    "m4",
    "mindset",
    "Your first offer is leverage",
    "Never go into a loop with only one in-flight. The difference between 1 offer and 2 is usually 20–40% in total comp.",
  ),
  t(
    "m5",
    "mindset",
    "Compound preparation",
    "20 min/day beats 4 hours on Sunday. Pattern memory wires itself through spacing, not cramming.",
  ),
  t(
    "m6",
    "mindset",
    "Record yourself",
    "Film one mock interview. Watching it back is unpleasant and more valuable than a week of solving problems.",
  ),
  t(
    "m7",
    "mindset",
    "Don't chase FAANG blindly",
    "Smaller high-signal companies often give better scope, mentorship, and equity upside. 'Brand' is a ceiling, not a floor.",
  ),
  t(
    "m8",
    "mindset",
    "Reverse-engineer the role",
    "Read the JD, find 3 current employees with similar titles on LinkedIn, and write down the 5 skills they seem to share. Prep for those, not the job title.",
  ),
  t(
    "m9",
    "mindset",
    "Negotiation is part of the interview",
    "Not negotiating leaves $10k–$50k on the table on average. A polite 'is there any flexibility on base?' is never a dealbreaker.",
  ),
  t(
    "m10",
    "mindset",
    "Energy management",
    "5 back-to-back rounds is an endurance sport. Water, protein, a 10-min walk between loops. Don't skip lunch.",
  ),

  // Career
  t(
    "cr1",
    "career",
    "Perf reviews are written in January",
    "Most of your promo packet is decided by the artifacts you shipped in Q1/Q2. Plan headline work for the start of the year, not the end.",
  ),
  t(
    "cr2",
    "career",
    "Change teams every 18–24 months",
    "Either internally or externally. Comfort plateaus compound into career plateaus.",
  ),
  t(
    "cr3",
    "career",
    "Write things down",
    "A brag doc with dates, links, and metrics is the single highest-leverage career habit. Update it Fridays.",
  ),
  t(
    "cr4",
    "career",
    "Find a mentor one level up",
    "Not a guru — someone one or two levels above you who will tell you what you don't want to hear.",
  ),
  t(
    "cr5",
    "career",
    "Own a domain, then expand",
    "Being 'the X person' on your team is how you get scope. Pick the thing nobody owns and become the owner.",
  ),
  t(
    "cr6",
    "career",
    "Refactor the roadmap, not the code",
    "Engineers optimize code. Senior engineers optimize what code gets written. The meta-skill is saying no to the right 3 items.",
  ),
  t(
    "cr7",
    "career",
    "Document as you go",
    "Write the design doc before the code. Future-you (and every reviewer) will thank you, and it's free promo-packet evidence.",
  ),
  t(
    "cr8",
    "career",
    "Career capital compounds",
    "The project that 'isn't cool' but 'is used by everyone' buys you more credibility than any flashy launch.",
  ),
  t(
    "cr9",
    "career",
    "Your network is your next job",
    "Reach out to ex-coworkers twice a year with no ask. That's the job search you don't notice doing.",
  ),
  t(
    "cr10",
    "career",
    "Say 'I don't know' early",
    "The senior move is saying 'I don't know, I'll find out' fast. Juniors bluff, seniors scope.",
  ),

  // Mix (behavioral + coding combos)
  t(
    "mx1",
    "coding",
    "Whiteboard > IDE",
    "Practice 2–3 problems a week on a whiteboard / paper with no syntax help. Real interviews are autocompletion-hostile.",
  ),
  t(
    "mx2",
    "system-design",
    "Every interview is a design interview",
    "Even in coding rounds, the interviewer is reading how you structure code. Modules, naming, error paths are all 'design' signal.",
  ),
  t(
    "mx3",
    "behavioral",
    "'Tell me about yourself' is 90 seconds",
    "Not your life story. Current role → one highlight → why this company. Anything longer and you've lost the room.",
  ),
  t(
    "mx4",
    "mindset",
    "Two hours of problems ≠ prep",
    "Prep is spaced, reviewed, mixed topics, and includes behavioral. Marathon grinding is mostly self-soothing.",
  ),
  t(
    "mx5",
    "frontend",
    "Read the React docs, not just blogs",
    "The newest React docs (react.dev) are ahead of 90% of blog posts. Read the 'You Might Not Need an Effect' page — it's a gold mine.",
  ),
  t(
    "mx6",
    "backend",
    "Queues are load balancers for time",
    "If you can't explain that sentence in your own words, revisit Kafka/SQS/RabbitMQ basics before your next infra round.",
  ),
  t(
    "mx7",
    "coding",
    "Re-read problems you solved 3 months ago",
    "You won't remember the solution, and you'll notice the patterns faster. Old solved problems are the cheapest practice you own.",
  ),
  t(
    "mx8",
    "system-design",
    "Cache invalidation is the hard question",
    "Know 3 strategies (TTL, write-through, pub-sub invalidation) and their tradeoffs. 'Cache invalidation is hard' is a meme; have a real answer.",
  ),
  t(
    "mx9",
    "behavioral",
    "Do a mock loop with a stranger",
    "Friends pull punches. Use mockin or Pramp or interviewing.io once before a serious onsite.",
  ),
  t(
    "mx10",
    "mindset",
    "Offer timing is negotiable too",
    "'Can I have a week to finish other loops?' is normal. Companies would rather wait than lose you to a competing offer they don't know about.",
  ),
]);

function t(id: string, category: TipCategory, title: string, body: string): Tip {
  return { id, category, title, body };
}

/** Returns today's day-of-year (0..365). */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Deterministic daily pick. Same tip for the whole calendar day. */
export function tipForDay(now: Date = new Date()): Tip {
  const idx = dayOfYear(now) % TIPS.length;
  return TIPS[idx];
}
