/**
 * Render the brand mark to PNG variants used by the site:
 *   - public/icon.png       (1024×1024, used by OG fallback / app stores)
 *   - app/apple-icon.png    (180×180, iOS home-screen)
 *
 * The SVG source is intentionally a small viewBox so it scales without
 * pixel-snapping artifacts. Run with `npm run logo` from the website dir.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const svgPath = resolve(root, "app/icon.svg");
const svg = await readFile(svgPath);

const targets = [
  { out: resolve(root, "public/icon.png"), size: 1024 },
  { out: resolve(root, "app/apple-icon.png"), size: 180 },
];

await Promise.all(
  targets.map(async ({ out, size }) => {
    await sharp(svg, { density: Math.max(72, size * 2) })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`✓ ${out.replace(root + "/", "")} (${size}×${size})`);
  }),
);
