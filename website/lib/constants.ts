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

export const APP = {
  name: "PrepOS",
  tagline: "Your interview prep, packed into a desktop OS.",
  description:
    "A macOS-style cockpit for tech interview prep. Dock, windows, focus mode, daily DSA, dev news, AI chat — every prep platform as a launchable app, in one calm shell.",
  twitter: "@iamshiv4m",
  email: "hello@prepos.app",
} as const;
