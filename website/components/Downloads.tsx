import { Apple, ArrowRight, Monitor, Package } from "lucide-react";
import GithubIcon from "@/components/icons/GithubIcon";
import type { LatestRelease, Platform } from "@/lib/releases";
import { formatBytes } from "@/lib/releases";
import { LATEST_RELEASE_URL, RELEASES_URL } from "@/lib/constants";

const PLATFORM_META: Record<
  Platform,
  { label: string; icon: React.ReactNode; accent: string; tag: string }
> = {
  mac: {
    label: "macOS",
    icon: <Apple className="h-5 w-5" />,
    accent: "from-indigo-500/15 via-violet-500/10 to-transparent",
    tag: "Apple silicon + Intel",
  },
  windows: {
    label: "Windows",
    icon: <Monitor className="h-5 w-5" />,
    accent: "from-sky-500/15 via-blue-500/10 to-transparent",
    tag: "10, 11 · 64-bit",
  },
  linux: {
    label: "Linux",
    icon: <Package className="h-5 w-5" />,
    accent: "from-amber-500/15 via-orange-500/10 to-transparent",
    tag: "AppImage + .deb",
  },
};

interface Props {
  release: LatestRelease;
}

export default function Downloads({ release }: Props) {
  const groups: Platform[] = ["mac", "windows", "linux"];

  return (
    <section id="download" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-violet-300">Download</div>
            <h2 className="mt-3 text-[36px] font-semibold tracking-[-0.015em] text-white sm:text-[44px]">
              Pick your platform.
            </h2>
            {release ? (
              <p className="mt-3 text-[14px] text-white/55">
                Latest release{" "}
                <a
                  href={release.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-violet-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  {release.tag}
                </a>{" "}
                · published {new Date(release.publishedAt).toLocaleDateString()}
              </p>
            ) : (
              <p className="mt-3 text-[14px] text-amber-200/85">
                No published release yet — head to the GitHub repo to build from source.
              </p>
            )}
          </div>
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            <GithubIcon className="h-3.5 w-3.5" /> All releases
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {groups.map((p) => {
            const meta = PLATFORM_META[p];
            const assets = release?.assets.filter((a) => a.platform === p) ?? [];
            return (
              <div
                key={p}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-6"
              >
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-90`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] text-white">
                      {meta.icon}
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.15em] text-white/45">
                      {meta.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[20px] font-semibold text-white">{meta.label}</h3>

                  {assets.length === 0 ? (
                    <p className="mt-3 text-[13px] text-white/50">
                      No build available yet for this platform.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {assets.map((a) => (
                        <li key={a.name}>
                          <a
                            href={a.url}
                            className="border-white/8 group flex items-center justify-between gap-3 rounded-lg border bg-white/[0.03] px-3 py-2.5 text-[13px] text-white/85 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                          >
                            <span className="flex items-center gap-2">
                              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/85">
                                {a.ext}
                              </span>
                              {a.arch && (
                                <span className="text-[12px] text-white/55">{a.arch}</span>
                              )}
                              <span className="truncate text-[12px] text-white/45">
                                {formatBytes(a.size)}
                              </span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  {assets.length === 0 && (
                    <a
                      href={LATEST_RELEASE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[12px] text-white/85 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                    >
                      Open releases page <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
