# Launch posts — copy-paste ready

Drafts for announcing PrepOS 0.1.0 across communities. Pick the one you need,
tweak names/links, ship.

> Production website: **https://prep-os.queztlabs.tech**.
> Repo: **https://github.com/iamshiv4m/prep-os**.

---

## Twitter / X — short thread (5 tweets)

**Tweet 1**

```
Built PrepOS — a desktop OS-style cockpit for tech interview prep.

One window. LeetCode + GfG + Striver + AI + Notes + Excalidraw — all running side by side.
No tab bankruptcy, no doomscroll, no leaving.

Free, open-source, runs offline. macOS / Windows / Linux.

🔗 https://prep-os.queztlabs.tech
```

**Tweet 2 — the "why"**

```
Prep stack right now for most folks:
- 12 LeetCode tabs
- 3 Notion docs
- 2 YouTube videos paused
- ChatGPT in another window
- Excalidraw open "just in case"

PrepOS: all of that ↑ becomes one focused desktop with a hard-lock focus mode and AI baked in.
```

**Tweet 3 — the cool feature**

```
Cmd+Shift+A captures any region of your screen → instantly pipes it into GPT-4o or Claude 3.5 Sonnet inside the app.

Stuck on a problem? Screenshot it. Get unstuck in 10s without leaving prep mode.
```

**Tweet 4 — for India**

```
First-run picker asks: are you a college student or working pro?

Student → Placement Prep mode auto-launches with LeetCode + GfG + Striver + NeetCode in your feed.
Pro → Project Work mode with GitHub + System Design + AI.

Built India-first. Built for grinders.
```

**Tweet 5 — CTA**

```
PrepOS 0.1.0 is out 🎉

✅ macOS Apple Silicon + Intel
✅ Windows
✅ Linux (.AppImage / .deb)

100% free, no signup, no telemetry. MIT licensed.

GitHub ⭐: https://github.com/iamshiv4m/prep-os
Download: https://prep-os.queztlabs.tech

Feedback / bug reports very welcome.
```

---

## Hacker News — Show HN

**Title**

```
Show HN: PrepOS – a desktop OS for technical interview prep
```

**Body** (HN allows minimal formatting; use plain text + URLs)

```
Hi HN — I built PrepOS over the past few months and just shipped 0.1.0.

It's a desktop app (Electron + React) that bundles the entire interview-prep
workflow into a single OS-style shell:

  - Plug in any platform — LeetCode, HackerRank, GfG, Excalidraw, GitHub —
    they run as sandboxed webviews with persistent logins.
  - Native apps for AI Chat (with screen capture → vision), Markdown notes,
    a Monaco code playground, and a daily.dev-style RSS reader.
  - Focus tracker with a "hard-lock" mode that blocks Cmd+Q until your
    timer ends. Lockdown mode goes one step further (kiosk + global
    shortcuts blocked) for the night-before-deadline grind.
  - First-run picker auto-configures it for a college student vs working
    professional persona.
  - The RSS reader covers HN, Dev.to, ByteByteGo, freeCodeCamp, GitHub
    Trending, plus India-specific sources (GeeksforGeeks, Striver via
    YouTube, NeetCode via YouTube, InterviewBit).

Why I built it: my prep workflow was 12 LeetCode tabs, 3 Notion docs, two
half-watched YouTube videos, an open ChatGPT, and Excalidraw "just in
case". PrepOS collapses that into one window with a focus tracker on top.

Tech notes:
  - Electron 38, React 18, TypeScript, Tailwind v4, Zustand, framer-motion.
  - AI Chat goes direct to OpenAI / Anthropic with your own key, stored
    encrypted via Electron safeStorage (OS keychain backed).
  - No telemetry, no signup, no account. The whole thing runs locally.
  - MIT licensed.

Not yet code-signed (so macOS Gatekeeper will warn once). Detailed
workaround on the install page — for Sequoia it's a one-time
`xattr -dr com.apple.quarantine /Applications/PrepOS.app`.

Roadmap I'd love feedback on:
  - Contest calendar widget (LeetCode / Codeforces / GfG schedule)
  - Built-in System Design library with Excalidraw scaffolds
  - Mock interview loop with timer + AI critique
  - Compensation data integration (something like levels.fyi inline)

Repo: https://github.com/iamshiv4m/prep-os
Site: https://prep-os.queztlabs.tech

Happy to answer anything about the architecture, the focus-guard hack, or
the Electron-vs-Tauri tradeoff. Roast it freely.
```

---

## Reddit — r/cscareerquestions / r/leetcode

**Title (r/leetcode)**

```
I built a desktop app that wraps LeetCode + GfG + AI + focus tracker into one window — open source, free
```

**Title (r/cscareerquestions)**

```
[Tool] PrepOS — open-source desktop cockpit for interview prep (LeetCode + System Design + AI in one window)
```

**Body**

```
Hey folks,

I made a thing. It's called **PrepOS** — a desktop app that takes the
"twelve tabs, four notebooks, two YouTube videos" prep workflow and
collapses it into one OS-style window.

What's inside:
- 🧩 **LeetCode, HackerRank, GfG, Excalidraw, GitHub** as plug-in
  windows (real webviews, your logins persist).
- ✨ **AI Chat** with **Cmd+Shift+A** screen-capture → instantly ask
  GPT-4o / Claude about any problem on your screen.
- 📰 **Daily Feed** — HN + Dev.to + ByteByteGo + GitHub Trending +
  **GfG + Striver YouTube + NeetCode YouTube + InterviewBit** for the
  India placement crowd.
- 🎯 **Focus tracker** with a hard-lock mode that blocks Cmd+Q until
  your timer ends. Lockdown mode for the night-before-deadline panic.
- 📝 Markdown **Notes**, Monaco **Playground**, and a built-in
  **Spotlight** (⌘K) over everything.
- 🎓 **First-run picker** asks if you're a college student or working
  pro and pre-loads the right mode + feeds.

Free, open-source (MIT), no signup, no telemetry, runs offline (except
when you're using AI). macOS / Windows / Linux.

**Download**: https://prep-os.queztlabs.tech
**GitHub** (⭐ if you find it useful): https://github.com/iamshiv4m/prep-os

I'd love feedback — especially from people prepping right now. What's
your biggest pain point that PrepOS doesn't solve yet? On my radar:
contest calendar widget, structured System Design library with Excalidraw
scaffolds, mock interview loop with AI critique. Tell me what to build
next.

(macOS Gatekeeper will warn on first launch since I haven't paid for a
$99/year Apple cert — install page has the one-line `xattr` workaround for
Sequoia. Same for Windows SmartScreen — click "More info → Run anyway"
once and it remembers forever.)
```

---

## Dev.to / Hashnode (long-form blog post)

**Title**

```
Building PrepOS: a desktop OS-style shell for tech interview prep
```

**Body skeleton** — flesh this out into ~1500 words when posting.

```markdown
## TL;DR

I built [PrepOS](https://prep-os.queztlabs.tech) — an Electron + React desktop app
that wraps LeetCode, GfG, Striver, NeetCode, freeCodeCamp, GitHub
Trending, ByteByteGo, an AI chat with vision, a Markdown notes app, a
Monaco playground, and a focus tracker into a single OS-style window.
Free, open-source (MIT), runs on macOS / Windows / Linux.

## The problem

[describe the 12-tabs-3-Notion-docs scenario, the context-switch tax, the
"I'll just check Twitter for 5 minutes" trap]

## What PrepOS does differently

[walk through: plugin system, native apps, focus tracker, lockdown,
persona picker, AI screen capture]

## Architecture quick tour

- Electron main process: secure IPC, plugin manager, AI gateway with
  AbortController timeouts, RSS fetcher with Promise.allSettled,
  Lockdown enforcer, Focus guard.
- Renderer: React 18, Zustand, framer-motion, Tailwind v4. Each plugin
  runs in a sandboxed `<webview>` with no nodeIntegration.
- Window manager: macOS-style snap zones, drag, resize, ⌘W close, ⌘M
  minimize, ⌘⌥+arrows for half-screen snaps.
- Persistence: electron-store for settings + per-app state, safeStorage
  for API keys (OS keychain backed).

## Three things I'd build differently next time

1. [Tauri vs Electron — bundle size, native feel, DX tradeoffs]
2. [Plugin manifest as JSON-from-disk vs hardcoded TypeScript array]
3. [Webview vs BrowserView — focus stealing, devtools, isolation]

## What's next

[contest calendar, system design library, mock interview loop, etc.]

## Links

- GitHub: [iamshiv4m/prep-os](https://github.com/iamshiv4m/prep-os)
- Website: [prep-os.queztlabs.tech](https://prep-os.queztlabs.tech)
- Latest release: [v0.1.0](https://github.com/iamshiv4m/prep-os/releases/latest)
```

---

## LinkedIn (1 paragraph)

```
Just shipped PrepOS — an open-source desktop app I've been building over the
past few months for technical interview preparation. It collapses the
typical "12 LeetCode tabs + 3 Notion docs + ChatGPT in another window"
prep workflow into a single OS-style desktop with focus mode, screenshot-
to-AI, and a built-in feed reader covering HN, ByteByteGo, GfG, Striver,
NeetCode, and InterviewBit. First-run picker tunes it for college students
or working pros. Free, MIT-licensed, runs on macOS / Windows / Linux —
no signup, no telemetry. Would love feedback from anyone prepping or
hiring right now.

→ https://prep-os.queztlabs.tech
→ https://github.com/iamshiv4m/prep-os
```

---

## Discord / Slack one-liner

```
🚀 PrepOS 0.1 is live — a desktop interview-prep cockpit (LeetCode + GfG + Striver + AI + focus mode in one window). Free + open-source. https://prep-os.queztlabs.tech
```

---

## Posting checklist

- [ ] Add 1 screenshot or 8-10s GIF to each post (HN, Reddit, Twitter)
- [ ] Star the repo from a second account before posting (no it doesn't matter, but it's polite to seed momentum from your own audience first)
- [ ] HN: post Tuesday or Wednesday, 8–11am PT for best front-page chance
- [ ] r/leetcode: post weekday morning IST for India audience overlap
- [ ] Twitter: pin the first tweet of the thread for ~24h
- [ ] Respond to every reply within the first 6h — momentum > polish
- [ ] Update CHANGELOG.md unreleased → 0.1.0 release date right before posting
