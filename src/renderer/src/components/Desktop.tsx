import { motion } from "framer-motion";
import { Lightbulb, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Tip } from "@shared/types";
import { usePlugins } from "../store/plugins";
import { useShell } from "../store/shell";
import { useWindows } from "../store/windows";

const HERO_LINES = [
  "Your interview prep cockpit.",
  "Capture anything → ask AI.",
  "All your platforms, one OS.",
];

const TIP_CATEGORY_LABEL: Record<string, string> = {
  behavioral: "Behavioral",
  coding: "Coding",
  "system-design": "System Design",
  frontend: "Frontend",
  backend: "Backend",
  career: "Career",
  mindset: "Mindset",
};

export default function Desktop() {
  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);
  const toggleLaunchpad = useShell((s) => s.toggleLaunchpad);
  const [tip, setTip] = useState<Tip | null>(null);
  const [allTips, setAllTips] = useState<Tip[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Double tap Cmd+Space is handled by Spotlight already via App-level listener
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        toggleLaunchpad();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleLaunchpad]);

  useEffect(() => {
    void (async () => {
      try {
        const today = await window.prepOS.tips.today();
        setTip(today);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const shuffle = async () => {
    try {
      const list = allTips ?? (await window.prepOS.tips.all());
      if (!allTips) setAllTips(list);
      if (!list || list.length === 0) return;
      const pick = list[Math.floor(Math.random() * list.length)];
      setTip(pick);
    } catch {
      /* ignore */
    }
  };

  const quickStart = plugins.filter((p) =>
    [
      "devtools-tech",
      "leetcode",
      "ai-chat",
      "dev-news",
      "playground",
      "notes",
      "excalidraw",
    ].includes(p.id),
  );

  const feedPlugin = useMemo(() => plugins.find((p) => p.id === "dev-news"), [plugins]);

  return (
    <div className="wallpaper wallpaper-noise relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 pt-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="text-[64px] font-semibold tracking-tight text-white/95 drop-shadow">
            PrepOS
          </div>
          <div className="max-w-md text-[14px] text-white/60">
            {HERO_LINES.map((line, i) => (
              <div key={i} className="leading-snug">
                {line}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="pointer-events-auto mt-4 flex flex-wrap items-center justify-center gap-3 px-6"
        >
          {quickStart.map((p) => (
            <button
              key={p.id}
              onClick={() => openApp(p)}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 backdrop-blur-md transition hover:border-white/25 hover:bg-white/10"
            >
              <span className="text-base">{p.icon}</span>
              <span>Open {p.name}</span>
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 text-[11px] text-white/55"
        >
          <Hint label="⌘ + K" text="Spotlight" />
          <Hint label="⌘ + L" text="Launchpad" />
          <Hint label="⌘⇧A" text="Capture region → AI" />
          <Hint label="⌘ + ," text="Settings" />
        </motion.div>

        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="pointer-events-auto mt-6 w-full max-w-xl px-6"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-amber-200/80">
                  <Lightbulb className="h-3 w-3" />
                  <span>Tip of the day</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-[1px] text-[10px] tracking-normal text-white/55">
                    {TIP_CATEGORY_LABEL[tip.category] ?? tip.category}
                  </span>
                </div>
                <button
                  onClick={shuffle}
                  title="Next tip"
                  className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <RefreshCcw className="h-3 w-3" /> Next
                </button>
              </div>
              <div className="mt-2 text-[14px] font-semibold text-white/95">{tip.title}</div>
              <div className="mt-1 text-[12px] leading-relaxed text-white/70">{tip.body}</div>
              {feedPlugin && (
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[11px] text-white/45">
                    Want the latest from across the web?
                  </span>
                  <button
                    onClick={() => openApp(feedPlugin)}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    Open {feedPlugin.name}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Hint({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center gap-1">
      <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
        {label}
      </kbd>
      <span>{text}</span>
    </div>
  );
}
