/**
 * Single source of truth for repository identity. The download buttons,
 * GitHub links, and Releases API helper all read from here so renaming the
 * repo / changing owner is a one-line edit.
 */
export const REPO = {
  owner: "iamshiv4m",
  name: "prep-os",
} as const;

export const REPO_URL = `https://github.com/${REPO.owner}/${REPO.name}`;
export const RELEASES_URL = `${REPO_URL}/releases`;
export const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`;
export const LATEST_API_URL = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/releases/latest`;

/** Public site URL — keep in sync with metadataBase + JSON-LD. */
export const SITE_URL = "https://prep-os.queztlabs.tech";

export const APP = {
  name: "PrepOS",
  tagline: "One desktop. Every prep tool.",
  /** Short marketing line used in the hero / OG card. */
  shortDescription:
    "A macOS-style cockpit for tech interview prep. Dock, windows, focus mode, daily DSA, dev news, AI chat — every prep platform as a launchable app, in one calm shell.",
  /** SEO description — kept under ~160 chars; mentions the keywords we rank for. */
  description:
    "Free desktop cockpit for tech interview prep. Daily DSA, system design, dev news, AI chat & focus mode. Built for India placement season + working pros.",
  twitter: "@iamshiv4m",
  email: "shivamjha190@gmail.com",
  author: {
    name: "Shivam Jha",
    url: "https://github.com/iamshiv4m",
  },
  /** Software version surfaced in JSON-LD; kept aligned with desktop app package.json. */
  version: "0.1.1",
} as const;
