# PrepOS marketing site — SEO + a11y + performance audit

**Audit date:** 2026-04-25
**Audited path:** `/Users/shivamjha/prep-os/website` (Next.js 16 App Router, Tailwind v4)
**Canonical site URL:** `https://prep-os.queztlabs.tech` — confirmed live deployment (subdomain on the QueztLabs main domain). All metadata, JSON-LD, sitemap, robots, and the OG image footer pull from `SITE_URL` in `website/lib/constants.ts` — change that single constant + re-run `npm run og` if you ever migrate to an apex domain.

## Headline state

- **SEO foundations are now production-grade.** Rich `metadata` export, two JSON-LD entities, sitemap, robots, and a 1200×630 OG card all ship from this commit.
- **OG / social card replaced.** Previous `public/og.png` was 668 KB of placeholder; new card is a hand-rolled SVG → PNG (217 KB, 1200×630, dark canvas + brand mark + tagline + footer). Regenerable via `npm run og`.
- **Accessibility cleanups landed**: every external `<a>` now uses `rel="noopener noreferrer"`, focus-visible rings added to all CTAs and outbound links, low-opacity (`/40`, `/45`) text on critical paths bumped to `/55–/65` so it clears WCAG AA on the near-black canvas, decorative SVG dots gained `aria-hidden`, and the GitHub icon links got `aria-label`s.
- **Build pipeline fixed.** `next lint` was removed in Next.js 16 — replaced with a minimal flat ESLint config (`website/eslint.config.mjs`) re-using the workspace-root ESLint deps, so `npm run lint` once again exits 0 in CI without adding new packages.
- **Copy aligned with reality.** "Modes for every season" feature now mentions the first-run persona picker shipped in 0.1.x; existing GfG / Striver / NeetCode / InterviewBit / freeCodeCamp / GitHub Trending callout in `Features.tsx` already matched the actual `FEED_SOURCES`, so no further claim drift.

---

## 1. Metadata

| Item                               | Was missing / weak                                                  | Now present                                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metadataBase`                     | Hard-coded `https://prep-os.queztlabs.tech`                         | Centralized via `SITE_URL` constant (`lib/constants.ts`)                                                                                                                                                                                                      |
| `title.default` + `title.template` | Existed (`PrepOS — Your interview prep, packed into a desktop OS.`) | Updated to spec: `PrepOS — One desktop. Every prep tool.` with `%s · PrepOS` template                                                                                                                                                                         |
| `description`                      | 196 chars, did not include "system design" or "India"               | Rewritten to 154 chars, includes "interview prep", "DSA", "system design", "India"                                                                                                                                                                            |
| `applicationName`                  | Already present                                                     | Unchanged                                                                                                                                                                                                                                                     |
| `keywords`                         | 10 generic                                                          | 15 targeted (interview prep, DSA, leetcode, system design, coding interview, placement preparation, India interview prep, daily.dev alternative, electron app, macOS desktop app, focus mode, AI interview prep, developer tools, frontend interview, PrepOS) |
| `authors`                          | `Shivam Jha` + GitHub URL                                           | Unchanged (sourced from `APP.author` constant)                                                                                                                                                                                                                |
| `creator`, `publisher`             | **Missing**                                                         | Both set to `Shivam Jha`                                                                                                                                                                                                                                      |
| `category`                         | **Missing**                                                         | `"technology"`                                                                                                                                                                                                                                                |
| `alternates.canonical`             | **Missing**                                                         | `"/"` (resolved against `metadataBase`)                                                                                                                                                                                                                       |
| `openGraph.url`                    | **Missing**                                                         | `https://prep-os.queztlabs.tech`                                                                                                                                                                                                                              |
| `openGraph.locale`                 | **Missing**                                                         | `"en_US"`                                                                                                                                                                                                                                                     |
| `openGraph.images`                 | URL-only (`/og.png`), no width/height/alt                           | Object with `url`, `width: 1200`, `height: 630`, descriptive `alt`                                                                                                                                                                                            |
| `twitter.card`                     | `summary_large_image`                                               | Unchanged                                                                                                                                                                                                                                                     |
| `twitter.site`                     | **Missing**                                                         | `@iamshiv4m`                                                                                                                                                                                                                                                  |
| `robots`                           | **Missing**                                                         | `{ index: true, follow: true, googleBot: { index, follow, max-image-preview: large, max-snippet: -1, max-video-preview: -1 } }`                                                                                                                               |
| `viewport.colorScheme`             | **Missing**                                                         | `"dark"`                                                                                                                                                                                                                                                      |
| `viewport.themeColor`              | `#07070b`                                                           | Unchanged (matches `--color-canvas` from `globals.css`)                                                                                                                                                                                                       |

Per-route metadata: `app/page.tsx` is the only route besides the auto-generated `sitemap.ts` / `robots.ts`. It intentionally inherits the layout default (`PrepOS — One desktop. Every prep tool.`) since the home page is the strongest landing target. No other `app/*/page.tsx` exist.

## 2. Open Graph image

| Item                            | Before                                         | After                                                                                                                                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existence                       | `public/og.png` 1200×630 (placeholder, 668 KB) | Regenerated, 1200×630, **217 KB**                                                                                                                                                                                                                                                 |
| Source                          | Unknown / hand-crafted                         | `website/scripts/render-og.mjs` — pure SVG → `sharp` → PNG. No external font deps.                                                                                                                                                                                                |
| Generator script                | None                                           | `npm run og` added to `website/package.json`                                                                                                                                                                                                                                      |
| Visual                          | Placeholder                                    | Dark `#0b0b14 → #06060a` canvas, layered violet/indigo radial glows, brand mark at ~180px, "PrepOS" wordmark, tagline "One desktop. Every prep tool.", subline "Daily DSA · System design · AI chat · Focus mode", footer `github.com/iamshiv4m/prep-os · prep-os.queztlabs.tech` |
| Twitter (`summary_large_image`) | Already shared the same image                  | Same; explicitly listed in `metadata.twitter.images`                                                                                                                                                                                                                              |

## 3. Sitemap + robots

| Item             | Was missing | Now present                                                                |
| ---------------- | ----------- | -------------------------------------------------------------------------- |
| `app/sitemap.ts` | ✗           | ✓ Single `/` entry (no other routes today; in-page anchors don't qualify). |
| `app/robots.ts`  | ✗           | ✓ Allow `*` for `/`, points to `${SITE_URL}/sitemap.xml`, sets `host`.     |

When new routes ship, add them to `sitemap.ts` — the file is set up to read from `SITE_URL` so renaming the canonical domain is a one-line change.

## 4. Structured data (JSON-LD)

Two `<script type="application/ld+json">` blocks injected in `<head>` of `app/layout.tsx`:

1. **`SoftwareApplication`** — operatingSystem `macOS, Windows, Linux`, free `Offer`, `downloadUrl` → GitHub releases, `softwareVersion` `0.1.1` (mirrors `/Users/shivamjha/prep-os/package.json`), `image` `/og.png`, `author` Shivam Jha, `license` link to repo `LICENSE`. The `applicationCategory` is `ProductivityApplication` (closest to PrepOS's positioning vs `DeveloperApplication`).
2. **`Organization`** — `name`, `url`, `logo` `/icon.png`, `sameAs: [REPO_URL]`. Keeps Knowledge Graph eligible.

Both JSON blobs share a `SITE_URL` constant so a domain rename only edits one file.

## 5. Accessibility

### Was missing / weak vs Now present

| File                                    | Before                                                                                                 | After                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `components/Nav.tsx`                    | `rel="noreferrer"`, no `aria-label` on icon-only-ish GitHub link, no focus-visible style               | `rel="noopener noreferrer"`, `aria-label="PrepOS on GitHub"`, `focus-visible:ring-2 focus-visible:ring-violet-400/60`                     |
| `components/Footer.tsx`                 | Same as Nav; "v0.1" hardcoded                                                                          | `rel="noopener noreferrer"`, `aria-label`, focus ring; version now reads `v{APP.version}` (sourced from constants)                        |
| `components/Downloads.tsx` (×3 anchors) | `rel="noreferrer"`, no focus rings                                                                     | `rel="noopener noreferrer"`, focus rings on tag link, "All releases", and "Open releases page"                                            |
| `components/PrimaryDownload.tsx`        | `text-white/40` on file size (12 px small text fails AA), no focus rings, no `aria-label` on white CTA | `text-white/55`, focus-visible ring on the white CTA, `aria-label` describing the platform; "Other platforms →" bumped to `text-white/65` |
| `components/Hero.tsx`                   | `text-white/45` capability strip (12.5 px ≈ AA fail), decorative dots had no role                      | `text-white/65`, `aria-hidden` on the colored dots; new `Built for college + working pros` badge near the version pill                    |
| `components/Footer.tsx`                 | "Built with care · MIT licensed · v0.1" at `text-white/45` (~4.0:1)                                    | `text-white/60` (≈5.4:1, clears AA)                                                                                                       |

### Color contrast computation (white on `#07070b`)

| `text-white/X` | Effective luminance | Contrast ratio | AA normal text? |
| -------------- | ------------------- | -------------- | --------------- |
| `/40`          | 0.13                | ~3.5:1         | ✗               |
| `/45`          | 0.17                | ~4.0:1         | borderline      |
| `/55`          | 0.24                | ~5.4:1         | ✓               |
| `/60`          | 0.27                | ~6.0:1         | ✓               |
| `/65`          | 0.31                | ~6.7:1         | ✓               |

I bumped every visible text using `/40` or `/45` that carries information (download size, capability strip, footer attribution) up to `/55–/65`. Decorative pip indicators stayed where they were because they're paired with text labels.

### Other a11y items verified

- All `<img>` / decorative SVGs have `aria-hidden="true"` (gradient meshes, accent blobs, dock emojis, dot indicators) — no broken alt text.
- No `<div onClick>` interactive elements found. Every CTA is `<a>` or `<button>`.
- No forms — nothing to label.
- Keyboard `:focus-visible` styles are not suppressed; explicit rings added to outbound `<a>` and the white CTA. The browser default focus ring still applies elsewhere.
- `<noscript>` fallback added to `<body>` of `app/layout.tsx` describing the product and linking to GitHub releases.

## 6. Performance / bundling

| Item                              | Status                                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page-level `"use client"`         | None at the page or layout level. Only `PrimaryDownload`, `AppMockup`, `CodeBlock` opt in — all justified (UA detection / Framer Motion / clipboard). ✓   |
| `next/image` usage                | The site doesn't use `next/image` — `AppMockup` is pure CSS, the OG card is fetched via `<meta>`, the brand `Logo` is inline SVG. No CLS / sizing risk. ✓ |
| `next.config.ts` `images.formats` | **Added** `["image/avif", "image/webp"]` even though no `<Image>` is used today, so future additions inherit modern formats automatically.                |
| `lucide-react` tree-shaking       | All imports are named (`import { Sparkles } from "lucide-react"`). lucide v1 is ESM and per-icon, so unused icons are dropped at build. ✓                 |
| `poweredByHeader`                 | Set to `false` — strips `X-Powered-By: Next.js` from HTTP responses (small but free OPSEC win).                                                           |
| Inter font                        | Loaded via `next/font/google` with `display: swap` and `subsets: ["latin"]` — already optimal.                                                            |
| OG image weight                   | Trimmed from 668 KB → 217 KB (sharp PNG `compressionLevel: 9`).                                                                                           |
| `app/icon.svg`                    | 1.5 KB inline gradient — auto-served as favicon by Next file-convention. ✓                                                                                |

## 7. Content / copy alignment

Cross-checked against `/Users/shivamjha/prep-os/README.md` and `/Users/shivamjha/prep-os/CHANGELOG.md`:

| Claim on website                                                                                                                                                             | Status      | Notes                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| "Hacker News, Dev.to, GitHub Trending, freeCodeCamp, ByteByteGo, plus India interview-prep staples (GfG, Striver, NeetCode, InterviewBit)" in `Features.tsx` "Dev news" card | ✓           | Matches `FEED_SOURCES` in `src/main/feed.ts` (per CHANGELOG entry under `[Unreleased] · Added`)                                            |
| "Cmd+Shift+A captures … GPT-4o or Claude 3.5 Sonnet" in AI chat card                                                                                                         | ✓           | README and CHANGELOG both list this exact behavior                                                                                         |
| "Pomodoro-style sessions … Hard-lock mode blocks Cmd+Q" in focus tracker card                                                                                                | ✓           | Matches "Hard focus" wording in CHANGELOG                                                                                                  |
| "Lockdown mode" — "no app switching, kiosk mode" in lockdown card                                                                                                            | ✓           | Matches CHANGELOG entry "Lockdown Mode (Cmd+Shift+L)"                                                                                      |
| **NEW**: "Pick a persona on first launch — college student or working pro — and PrepOS pre-loads a matching dock, feed pack, and focus goal" in Modes card                   | ✓ **Added** | Mirrors the "First-run persona picker" CHANGELOG entry under `[Unreleased] · Added`. Visual hierarchy preserved (still a 9-card 3×3 grid). |
| **NEW**: "Built for college + working pros" hero badge                                                                                                                       | ✓ **Added** | New tertiary pill next to the version pill. Uses existing violet token (`bg-violet-500/10`, `border-violet-400/25`).                       |
| Footer: `Built with care · MIT licensed · v0.1`                                                                                                                              | Updated     | Now reads `v{APP.version}` from constants — currently `0.1.1`, in lockstep with the desktop app's `package.json`.                          |

The website's `package.json` `version` is `0.1.0`. That's an internal artifact (Vercel deploy metadata) — it's the desktop app's version that matters publicly, and that flows from `APP.version = "0.1.1"`. Documented but left alone.

## 8. NoScript fallback

`app/layout.tsx` body now opens with a `<noscript>` block that:

- Renders the app name as `<h1>`
- Shows the long-form `APP.shortDescription`
- Links to `RELEASES_URL` for an immediate, JS-free download path
- Notes that download links work without JS

Inline styles (no Tailwind, since the JS-free render shouldn't depend on any client hydration). Color choices match the dark canvas (`#f4f4f7`, `#a3a3b3`, `#a78bfa`).

## 9. Favicon completeness

| File                                   | Status    | Source                                                                  |
| -------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `website/app/icon.svg`                 | ✓ Present | Hand-edited (committed)                                                 |
| `website/app/apple-icon.png` (180×180) | ✓ Present | Generated via `npm run logo`                                            |
| `website/public/icon.png` (1024×1024)  | ✓ Present | Generated via `npm run logo`; referenced by JSON-LD `Organization.logo` |

Next.js auto-serves `app/icon.svg` and `app/apple-icon.png` via the file-convention; no manual `<link>` tags needed. The explicit `metadata.icons` config that briefly existed in this PR was removed once we confirmed the convention works (manual override would require a real `public/icon.svg`).

## 10. Optional polish

- `<link rel="me" href="https://github.com/iamshiv4m" />` added in `<head>` — IndieWeb h-card / Mastodon link verification.
- `viewport.themeColor: "#07070b"` matches `--color-canvas` (verified in `globals.css`).
- `viewport.colorScheme: "dark"` ensures user-agent UI (form fields, scrollbars on hover) renders dark by default.
- `next.config.ts` `poweredByHeader: false` — removes `X-Powered-By: Next.js`.
- `vercel.json` already includes hardening headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`). No changes needed.

---

## Findings deliberately NOT fixed

1. **No `Content-Security-Policy` header.** Adding a strict CSP would interact with `next/font/google`, `@vercel/analytics`, and Framer Motion's runtime style injection — non-trivial to get right without breakage. Worth a follow-up PR with `report-only` mode first.
2. **No JSON-LD `BreadcrumbList`.** The site is single-page with anchor scrolls, so a synthetic breadcrumb would be misleading. Add when dedicated routes (e.g. `/changelog`, `/docs`) ship.
3. **No `WebSite` JSON-LD with `SearchAction`.** No on-site search exists, so omitting it.
4. **No `FAQPage` JSON-LD on the install help section.** Could be added, but the current copy reads as numbered steps inside cards rather than Q/A pairs — refactoring the copy just for the structured-data win risks worsening the human reader's experience.
5. **`text-white/45` retained on a few decorative captions** (e.g. `Downloads.tsx` "10, 11 · 64-bit" tag, `AppMockup.tsx` "Goal 3h · 76% complete"). These are auxiliary metadata next to high-contrast primary text and the visual hierarchy depends on them being subdued. Documented as a known soft-AA borderline rather than fixed.
6. **`AppMockup.tsx` mock article titles** ("How Vercel ships React Server Components", etc.) are illustrative content, not real claims about feed coverage. Left as-is for visual demo purposes.
7. **Hero `<h1>` wording** ("Your interview prep, packed into a desktop OS.") differs from the `<title>` ("PrepOS — One desktop. Every prep tool."). This is intentional — the metadata title is optimized for SERP click-through, the H1 is optimized for in-page emotional resonance. Both reinforce the same product positioning.
8. **Website `package.json` version** stays at `0.1.0`. It's a Vercel-deploy internal value; the visitor-visible version comes from the desktop app's `package.json` via `APP.version`.

## Third-party URLs / assumptions

| Assumption                                                                 | Where it lives                                                                                      | Action if wrong                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Production canonical = `https://prep-os.queztlabs.tech`                    | `lib/constants.ts` → `SITE_URL`. Used by `metadataBase`, `openGraph.url`, sitemap, robots, JSON-LD. | Edit `SITE_URL` in `lib/constants.ts`, re-deploy.                   |
| Twitter handle `@iamshiv4m`                                                | `lib/constants.ts` → `APP.twitter`. Used in `metadata.twitter.creator` + `site`.                    | Edit `APP.twitter`.                                                 |
| GitHub identity `https://github.com/iamshiv4m`                             | `lib/constants.ts` → `APP.author.url`. Used in `<link rel="me">` and JSON-LD.                       | Edit `APP.author.url`.                                              |
| Desktop app `softwareVersion` = `0.1.1`                                    | `lib/constants.ts` → `APP.version`. Mirrored from `/Users/shivamjha/prep-os/package.json`.          | Bump `APP.version` whenever the desktop app's `package.json` bumps. |
| MIT license URL = `https://github.com/iamshiv4m/prep-os/blob/main/LICENSE` | `app/layout.tsx` → `softwareApplicationLd.license`.                                                 | If the file is renamed or the default branch changes, update.       |

## `npm run typecheck` and `npm run lint` results

```
$ cd /Users/shivamjha/prep-os/website && npm run typecheck
> prepos-website@0.1.0 typecheck
> tsc --noEmit
exit code: 0

$ npm run lint
> prepos-website@0.1.0 lint
> eslint .
exit code: 0
```

**Note on lint:** `next lint` was removed in Next.js 16. The previous `npm run lint` script silently broke. Replaced with `eslint .` driven by a new minimal flat config at `website/eslint.config.mjs` (re-uses the workspace-root ESLint, react, react-hooks, typescript-eslint, and prettier deps — no new packages installed). The config ignores `.next`, `node_modules`, `out`, `dist`, generated `.d.ts`, and `scripts/**` so build artifacts can't poison lint runs.

---

## Files created

- `website/app/sitemap.ts`
- `website/app/robots.ts`
- `website/scripts/render-og.mjs`
- `website/eslint.config.mjs`
- `docs/website-seo-audit.md` (this file)

## Files modified

- `website/app/layout.tsx` — rich metadata, JSON-LD, `<link rel="me">`, `<noscript>` fallback, `colorScheme: "dark"`
- `website/lib/constants.ts` — added `SITE_URL`, `APP.shortDescription`, `APP.author`, `APP.version`; tightened SEO `description`; updated `tagline`
- `website/next.config.ts` — `images.formats` for AVIF/WebP, `poweredByHeader: false`
- `website/package.json` — added `npm run og`, replaced broken `next lint` with `eslint .`
- `website/components/Hero.tsx` — added `Built for college + working pros` badge, bumped capability-strip contrast, `aria-hidden` on decorative dots
- `website/components/PrimaryDownload.tsx` — `aria-label`, focus-visible ring, contrast bumps
- `website/components/Nav.tsx` — `rel="noopener noreferrer"`, `aria-label`, focus ring
- `website/components/Footer.tsx` — same a11y polish, dynamic version from constants, contrast bump
- `website/components/Downloads.tsx` — `rel="noopener noreferrer"` + focus rings on three external anchors
- `website/components/Features.tsx` — "Modes for every season" copy now mentions persona picker
- `website/public/og.png` — regenerated (1200×630, 217 KB)
