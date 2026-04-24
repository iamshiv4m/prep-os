"use client";

import { motion } from "motion/react";
import { Apple, ArrowRight, Download, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import type { LatestRelease, Platform, ReleaseAsset } from "@/lib/releases";
import { formatBytes, pickPrimaryAsset } from "@/lib/releases";
import { LATEST_RELEASE_URL } from "@/lib/constants";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "mac";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  return "mac";
}

const LABEL: Record<Platform, string> = {
  mac: "Download for macOS",
  windows: "Download for Windows",
  linux: "Download for Linux",
};

const PLATFORM_ICON: Record<Platform, React.ReactNode> = {
  mac: <Apple className="h-4 w-4" />,
  windows: <Monitor className="h-4 w-4" />,
  linux: <Download className="h-4 w-4" />,
};

interface Props {
  release: LatestRelease;
}

/**
 * Hero CTA — uses the visitor's UA to pick the right primary download asset
 * on mount, falls back to the GitHub Releases page when no asset matches
 * (first deploy, before any release exists, etc.).
 */
export default function PrimaryDownload({ release }: Props) {
  const [platform, setPlatform] = useState<Platform>("mac");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setMounted(true);
  }, []);

  const asset: ReleaseAsset | null = pickPrimaryAsset(release, platform);
  const href = asset?.url ?? LATEST_RELEASE_URL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
    >
      <a
        href={href}
        className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 text-[14px] font-semibold text-black shadow-[0_20px_50px_-15px_rgba(255,255,255,0.5)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {mounted ? PLATFORM_ICON[platform] : <Download className="h-4 w-4" />}
        <span>{mounted ? LABEL[platform] : "Download PrepOS"}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>
      <a href="#download" className="text-[13px] text-white/60 transition-colors hover:text-white">
        Other platforms →
      </a>
      {asset && (
        <span className="text-[12px] text-white/40">
          {asset.ext.toUpperCase()} · {formatBytes(asset.size)}
          {asset.arch ? ` · ${asset.arch}` : ""}
        </span>
      )}
    </motion.div>
  );
}
