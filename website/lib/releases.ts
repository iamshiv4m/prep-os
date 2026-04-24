import { LATEST_API_URL } from "./constants";

export type Platform = "mac" | "windows" | "linux";

export type ReleaseAsset = {
  name: string;
  url: string;
  size: number;
  platform: Platform;
  arch?: string;
  /** "dmg" / "exe" / "AppImage" / "deb" / "zip" — used for label + icon. */
  ext: string;
};

export type LatestRelease = {
  tag: string;
  name: string;
  publishedAt: string;
  notes: string;
  htmlUrl: string;
  assets: ReleaseAsset[];
} | null;

type GitHubAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type GitHubRelease = {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: GitHubAsset[];
};

function classifyAsset(name: string): { platform: Platform; arch?: string; ext: string } | null {
  const lower = name.toLowerCase();
  // macOS
  if (lower.endsWith(".dmg")) {
    return {
      platform: "mac",
      arch: lower.includes("arm64") ? "arm64" : lower.includes("x64") ? "x64" : undefined,
      ext: "dmg",
    };
  }
  if (lower.endsWith(".zip") && lower.includes("mac")) {
    return {
      platform: "mac",
      arch: lower.includes("arm64") ? "arm64" : lower.includes("x64") ? "x64" : undefined,
      ext: "zip",
    };
  }
  // Windows
  if (lower.endsWith(".exe")) return { platform: "windows", arch: "x64", ext: "exe" };
  if (lower.endsWith(".msi")) return { platform: "windows", arch: "x64", ext: "msi" };
  // Linux
  if (lower.endsWith(".appimage"))
    return { platform: "linux", arch: lower.includes("arm") ? "arm64" : "x64", ext: "AppImage" };
  if (lower.endsWith(".deb"))
    return { platform: "linux", arch: lower.includes("arm") ? "arm64" : "x64", ext: "deb" };
  if (lower.endsWith(".rpm")) return { platform: "linux", arch: "x64", ext: "rpm" };
  return null;
}

/**
 * Server-side fetch of the latest GitHub release. Cached for 10 minutes so
 * the landing page doesn't hammer the API and we stay well under the 60/hr
 * unauthenticated limit even with viral traffic spikes.
 */
export async function getLatestRelease(): Promise<LatestRelease> {
  try {
    const res = await fetch(LATEST_API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GitHubRelease;
    if (data.draft || data.prerelease) return null;

    const assets: ReleaseAsset[] = data.assets
      .map((a) => {
        const meta = classifyAsset(a.name);
        if (!meta) return null;
        return {
          name: a.name,
          url: a.browser_download_url,
          size: a.size,
          ...meta,
        } satisfies ReleaseAsset;
      })
      .filter((a): a is ReleaseAsset => a !== null);

    return {
      tag: data.tag_name,
      name: data.name || data.tag_name,
      publishedAt: data.published_at,
      notes: data.body || "",
      htmlUrl: data.html_url,
      assets,
    };
  } catch {
    return null;
  }
}

export function pickPrimaryAsset(release: LatestRelease, platform: Platform): ReleaseAsset | null {
  if (!release) return null;
  const candidates = release.assets.filter((a) => a.platform === platform);
  if (candidates.length === 0) return null;
  // Prefer dmg > zip on mac, exe on windows, AppImage > deb on linux.
  const order: Record<Platform, string[]> = {
    mac: ["dmg", "zip"],
    windows: ["exe", "msi"],
    linux: ["AppImage", "deb", "rpm"],
  };
  for (const ext of order[platform]) {
    const match = candidates.find((c) => c.ext === ext);
    if (match) return match;
  }
  return candidates[0] ?? null;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
