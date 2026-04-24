import { app } from "electron";
import type { BrowserWindow } from "electron";
import type { UpdateCheckResult } from "@shared/types";

/**
 * Lightweight, signing-free update checker. Instead of using electron-updater
 * (which requires code-signed binaries on macOS and a matching install format
 * on Linux), we just fetch the latest GitHub release and — if it's newer than
 * the running build — surface a banner that deep-links the user back to the
 * website's download page. Users re-install manually.
 *
 * Trade-off: no silent / in-place upgrade, but zero cert cost and zero
 * platform-specific breakage.
 */

const REPO_OWNER = "iamshiv4m";
const REPO_NAME = "prep-os";
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
/**
 * Where to send the user when an update is available. If the marketing
 * website env var is set at build time we prefer it (branded download page
 * with OS-aware CTAs); otherwise we fall back to the production deployment
 * at queztlabs, and finally to the release's own `html_url` from the API
 * response (always guaranteed to exist).
 */
const DEFAULT_WEBSITE_URL = "https://prep-os.queztlabs.tech#download";
const WEBSITE_DOWNLOAD_URL = process.env.PREPOS_WEBSITE_URL || DEFAULT_WEBSITE_URL;

type GitHubRelease = {
  tag_name: string;
  html_url: string;
  body: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
};

function stripV(v: string): string {
  return v.replace(/^v/i, "").trim();
}

function parse(v: string): [number, number, number] {
  const [a = "0", b = "0", c = "0"] = stripV(v).split(".");
  return [parseInt(a, 10) || 0, parseInt(b, 10) || 0, parseInt(c, 10) || 0];
}

/** Strict "a > b" SemVer compare (major, minor, patch only). */
function isNewer(a: string, b: string): boolean {
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i];
  }
  return false;
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!app.isPackaged) return { status: "dev" };

  const current = app.getVersion();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { status: "error", message: `GitHub API ${res.status}` };
    }

    const data = (await res.json()) as GitHubRelease;
    if (data.draft || data.prerelease) {
      return { status: "up-to-date", current };
    }

    const latest = stripV(data.tag_name);
    if (isNewer(latest, current)) {
      return {
        status: "available",
        current,
        latest,
        // Prefer the branded website if one is configured, otherwise send the
        // user directly to the GitHub release page (always resolvable).
        url: WEBSITE_DOWNLOAD_URL || data.html_url,
        notes: (data.body ?? "").slice(0, 2000),
        publishedAt: data.published_at,
      };
    }

    return { status: "up-to-date", current };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { status: "error", message: "Update check timed out. Are you online?" };
    }
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fire-and-forget check ~10s after boot. If an update is available, push it
 * into the renderer — the banner component decides whether to show it based
 * on the version the user already dismissed.
 */
export function scheduleStartupCheck(getWindow: () => BrowserWindow | null): void {
  if (!app.isPackaged) return;
  setTimeout(async () => {
    const result = await checkForUpdate();
    if (result.status === "available") {
      getWindow()?.webContents.send("update:available", result);
    }
  }, 10_000);
}
