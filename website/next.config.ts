import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  reactStrictMode: true,
  // Pin Turbopack to this directory — without it Next walks upward looking
  // for a lockfile and may pick one outside the website (we have a sibling
  // electron app sharing this workspace).
  turbopack: {
    root: path.join(__dirname),
  },
  // Show release version in the footer at build time so users can verify
  // they're looking at the freshly deployed cut.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default config;
