import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Tip } from "@shared/types";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import FocusWidget from "./desktop/FocusWidget";
import TasksWidget from "./desktop/TasksWidget";
import PotdWidget from "./desktop/PotdWidget";
import FeedWidget from "./desktop/FeedWidget";
import PluginIcon from "./PluginIcon";
import { Lightbulb, RefreshCcw } from "lucide-react";

const TIP_CATEGORY_LABEL: Record<string, string> = {
  behavioral: "Behavioral",
  coding: "Coding",
  "system-design": "System Design",
  frontend: "Frontend",
  backend: "Backend",
  career: "Career",
  mindset: "Mindset",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still grinding";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Working late";
}

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Desktop() {
  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);

  const [tip, setTip] = useState<Tip | null>(null);
  const [allTips, setAllTips] = useState<Tip[] | null>(null);

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

  const quickStart = useMemo(
    () =>
      plugins.filter((p) =>
        [
          "devtools-tech",
          "leetcode",
          "ai-chat",
          "playground",
          "notes",
          "excalidraw",
          "feed",
        ].includes(p.id),
      ),
    [plugins],
  );

  const feedPlugin = useMemo(() => plugins.find((p) => p.id === "feed"), [plugins]);
  const focusPlugin = useMemo(() => plugins.find((p) => p.id === "devtools-tech"), [plugins]);

  return (
    <div className="wallpaper wallpaper-noise relative h-full w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-y-auto">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-40 pt-16">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="pointer-events-auto flex flex-col gap-1 text-left"
          >
            <div className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/45">
              {todayLabel()}
            </div>
            <div className="text-[38px] font-semibold leading-tight tracking-tight text-white/95">
              {greeting()} — ready to level up?
            </div>
            <div className="text-[14px] text-white/55">
              Your interview cockpit · capture anything → ask AI · all your platforms, one OS.
            </div>
          </motion.div>

          {/* Widget grid */}
          <div className="pointer-events-auto grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FocusWidget delay={0.05} onOpenFocus={() => focusPlugin && openApp(focusPlugin)} />
            <PotdWidget delay={0.1} />
            <TasksWidget delay={0.15} />
            <FeedWidget delay={0.2} onOpenFeed={() => feedPlugin && openApp(feedPlugin)} />
          </div>

          {/* Quick Start */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="pointer-events-auto flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-white/45">
                Quick Start
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/45">
                <Hint label="⌘K" text="Spotlight" />
                <Hint label="⌘L" text="Launchpad" />
                <Hint label="⌘/" text="Shortcuts" />
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              {quickStart.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openApp(p)}
                  className="group flex w-[84px] flex-col items-center gap-1.5 focus:outline-none"
                >
                  <div className="transition-transform group-hover:-translate-y-0.5 group-hover:scale-[1.05]">
                    <PluginIcon plugin={p} size={56} />
                  </div>
                  <span className="max-w-full truncate text-[11.5px] text-white/80 group-hover:text-white">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tip of the day — click anywhere on the card for next tip */}
          {tip && (
            <motion.button
              type="button"
              onClick={() => void shuffle()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="group pointer-events-auto w-full rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.055] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              style={{ boxShadow: "0 20px 50px -20px rgba(0,0,0,0.6)" }}
              aria-label="Next tip"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-amber-200/80">
                  <Lightbulb className="h-3 w-3" />
                  <span>Tip of the day</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-[1px] text-[10px] tracking-normal text-white/55">
                    {TIP_CATEGORY_LABEL[tip.category] ?? tip.category}
                  </span>
                </div>
                <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 transition-colors group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">
                  <RefreshCcw className="h-3 w-3" /> Next
                </span>
              </div>
              <div className="mt-2 text-[14px] font-semibold text-white/95">{tip.title}</div>
              <div className="mt-1 text-[12px] leading-relaxed text-white/70">{tip.body}</div>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function Hint({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center gap-1">
      <kbd className="rounded border border-white/15 bg-white/10 px-1.5 py-[1px] text-[10px] font-medium tracking-wide">
        {label}
      </kbd>
      <span>{text}</span>
    </div>
  );
}
