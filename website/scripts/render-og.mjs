/**
 * Render the OG / Twitter social card to public/og.png at 1200×630.
 *
 * Built from a hand-rolled SVG so we don't depend on system fonts. Inter
 * isn't bundled — sharp falls back to its default sans, which on Linux CI
 * (the relevant env) gives a clean, neutral result. The shapes/glow do the
 * heavy lifting visually and the type sits inside a generous bounding box,
 * so the fallback font is fine.
 *
 * Run with `npm run og` from the website dir.
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const out = resolve(root, "public/og.png");

const W = 1200;
const H = 630;

/** PrepOS brand mark, scaled to ~180px and centered horizontally above the title. */
const LOGO_SVG = `
  <g transform="translate(510, 110) scale(4.5)">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7C5CFF"/>
        <stop offset="55%" stop-color="#6447F0"/>
        <stop offset="100%" stop-color="#4F32D8"/>
      </linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="glyph" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white"/>
        <stop offset="100%" stop-color="white" stop-opacity="0.92"/>
      </linearGradient>
      <radialGradient id="inner" cx="50%" cy="0%" r="80%">
        <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="40" height="40" rx="11" fill="url(#bg)"/>
    <rect width="40" height="40" rx="11" fill="url(#inner)"/>
    <rect width="40" height="20" rx="11" fill="url(#shine)"/>
    <rect x="0.6" y="0.6" width="38.8" height="38.8" rx="10.4" fill="none" stroke="white" stroke-opacity="0.18" stroke-width="1"/>
    <path fill-rule="evenodd" clip-rule="evenodd" fill="url(#glyph)"
      d="M12 10.5 H21.5 C25.366 10.5 28.5 13.634 28.5 17.5 C28.5 21.366 25.366 24.5 21.5 24.5 H16.5 V29.5 H12 V10.5 Z M16.5 14.5 V20.5 H21.5 C23.1569 20.5 24.5 19.1569 24.5 17.5 C24.5 15.8431 23.1569 14.5 21.5 14.5 H16.5 Z"/>
  </g>
`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="canvas" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0b14"/>
      <stop offset="100%" stop-color="#06060a"/>
    </linearGradient>

    <radialGradient id="glow1" cx="20%" cy="10%" r="55%">
      <stop offset="0%" stop-color="rgba(124,92,255,0.45)"/>
      <stop offset="100%" stop-color="rgba(124,92,255,0)"/>
    </radialGradient>
    <radialGradient id="glow2" cx="85%" cy="40%" r="50%">
      <stop offset="0%" stop-color="rgba(99,102,241,0.40)"/>
      <stop offset="100%" stop-color="rgba(99,102,241,0)"/>
    </radialGradient>
    <radialGradient id="glow3" cx="50%" cy="100%" r="60%">
      <stop offset="0%" stop-color="rgba(168,85,247,0.30)"/>
      <stop offset="100%" stop-color="rgba(168,85,247,0)"/>
    </radialGradient>

    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f4f4f7"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#canvas)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  <rect width="${W}" height="${H}" fill="url(#glow3)"/>

  <rect x="32" y="32" width="${W - 64}" height="${H - 64}" rx="28" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

  ${LOGO_SVG}

  <text
    x="50%" y="395"
    text-anchor="middle"
    fill="url(#title)"
    font-family="Inter, -apple-system, 'Segoe UI', system-ui, sans-serif"
    font-size="92"
    font-weight="700"
    letter-spacing="-2.5"
  >PrepOS</text>

  <text
    x="50%" y="465"
    text-anchor="middle"
    fill="rgba(244,244,247,0.75)"
    font-family="Inter, -apple-system, 'Segoe UI', system-ui, sans-serif"
    font-size="34"
    font-weight="500"
    letter-spacing="-0.5"
  >One desktop. Every prep tool.</text>

  <text
    x="50%" y="510"
    text-anchor="middle"
    fill="rgba(167,139,250,0.85)"
    font-family="Inter, -apple-system, 'Segoe UI', system-ui, sans-serif"
    font-size="20"
    font-weight="500"
    letter-spacing="0.8"
  >Daily DSA · System design · AI chat · Focus mode</text>

  <text
    x="50%" y="${H - 60}"
    text-anchor="middle"
    fill="rgba(244,244,247,0.45)"
    font-family="'JetBrains Mono', 'SF Mono', Menlo, monospace"
    font-size="18"
    letter-spacing="0.5"
  >github.com/iamshiv4m/prep-os  ·  prep-os.queztlabs.tech</text>
</svg>
`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9, quality: 90, palette: false }).toFile(out);

console.log(`✓ public/og.png (${W}×${H})`);
