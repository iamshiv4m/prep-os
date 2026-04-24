import { Sparkles } from "lucide-react";
import type { LatestRelease } from "@/lib/releases";
import PrimaryDownload from "./PrimaryDownload";
import AppMockup from "./AppMockup";

interface Props {
  release: LatestRelease;
}

export default function Hero({ release }: Props) {
  const version = release?.tag ?? "preview";

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="gradient-mesh pointer-events-none absolute inset-0 opacity-90" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-20 pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pb-28 lg:pt-24">
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/65">
            <Sparkles className="h-3 w-3 text-violet-300" />
            <span>{version} — desktop app for engineers</span>
          </div>

          <h1 className="mt-5 text-balance text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-[56px] lg:text-[64px]">
            Your interview prep,
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              packed into a desktop OS.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-[16px] leading-relaxed text-white/65">
            PrepOS is a calm, focused launchpad for software engineering interviews. Daily DSA, dev
            news, focus tracker, AI chat, lockdown mode, and every prep platform — all running
            side-by-side in a familiar macOS-style shell.
          </p>

          <div className="mt-8">
            <PrimaryDownload release={release} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-white/45">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Free, no signup
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Works offline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Local-first storage
            </span>
          </div>
        </div>

        <div className="relative">
          <AppMockup />
        </div>
      </div>
    </section>
  );
}
