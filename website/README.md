# PrepOS — Marketing site

Landing page + download portal for [PrepOS](../README.md). Lives next to the Electron
app in the same repo so a single `git push` can ship both.

## Stack

- **Next.js 16** (App Router, Turbopack, RSC)
- **React 19**
- **Tailwind CSS v4** (CSS-first `@theme`, no JS config)
- **Motion** (the new framer-motion package, for hero + dock animations)
- **Lucide** for icons (with an inline `GithubIcon` since brand glyphs were dropped in v1)

## Local dev

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page server-fetches the
latest GitHub Release once every 10 minutes and renders OS-aware download buttons.

## Build

```bash
npm run build      # production bundle
npm run typecheck  # tsc --noEmit
```

## Deploy to Vercel

1. Push the repo to GitHub (already at [github.com/iamshiv4m/prep-os](https://github.com/iamshiv4m/prep-os)).
2. Import the project on [vercel.com/new](https://vercel.com/new).
3. **Important** — set **Root Directory** to `website` in Vercel settings (the
   Electron app is in the repo root, not the website).
4. Framework should auto-detect as Next.js. Build command `npm run build`,
   install command `npm install`. No env vars required.
5. Hit Deploy. First build takes ~60 seconds.

The site re-validates the GitHub Releases API every 10 minutes via
`fetch(..., { next: { revalidate: 600 } })`, so freshly cut releases appear without
a redeploy.

### Custom domain

The site is currently deployed at **`prep-os.queztlabs.tech`** (subdomain of the
QueztLabs main domain). To move to a top-level apex like `prepos.app`:

1. Buy the domain on Namecheap / Cloudflare (~₹1,000/year).
2. In Vercel → Project → **Settings → Domains** → add the domain. Vercel hands you
   the DNS records; paste them at your registrar.
3. SSL provisions automatically.
4. Update `SITE_URL` in [`website/lib/constants.ts`](./lib/constants.ts) — that's
   the single source of truth wired into `metadataBase`, JSON-LD, OG image footer,
   sitemap, and robots — then re-run `npm run og` to regenerate the OG card.

## Releasing the desktop app (auto-uploads to website downloads)

The website pulls from GitHub Releases — no manual file uploads needed.

```bash
# In the repo ROOT (not website/)
npm version patch         # bumps package.json + creates tag v0.1.1
git push --follow-tags
```

The tag push triggers `.github/workflows/release.yml` which builds for
macOS / Windows / Linux in parallel and uploads the artifacts to a draft
GitHub Release. Open the release in the GitHub UI and click **Publish release**
— within ~10 minutes (cache window) the website's download buttons update
automatically.

## File structure

```
website/
  app/
    layout.tsx        Root metadata, font loading, global styles
    page.tsx          Server component — fetches latest release
    globals.css       Tailwind v4 + design tokens (@theme)
  components/
    Nav.tsx           Sticky top bar
    Hero.tsx          Headline + primary CTA + app mockup
    AppMockup.tsx     CSS-only PrepOS desktop preview (no PNG needed)
    PrimaryDownload.tsx  Client component — UA-detect + smart CTA
    Features.tsx      9-card feature grid
    Downloads.tsx     Per-platform asset list (mac / win / linux)
    InstallNote.tsx   Gatekeeper / SmartScreen bypass instructions
    Footer.tsx
    icons/
      GithubIcon.tsx  Inline SVG (lucide v1 dropped brand icons)
  lib/
    constants.ts      Repo identity, app metadata
    releases.ts       GitHub Releases API helper + asset classifier
  public/
    icon.png          App icon (1024×1024, copied from build/)
    og.png            Open Graph share image
```

## Design tokens

All colors live in `app/globals.css` under `@theme`. Edit there to re-skin the
site — Tailwind v4 picks them up automatically without a config file.
