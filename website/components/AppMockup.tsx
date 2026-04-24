"use client";

import { motion } from "motion/react";
import { Code2, Flame, ListTodo, Newspaper, Timer } from "lucide-react";

const DOCK_APPS = ["💻", "🤖", "📓", "🧪", "🎯", "📰", "⚙️"];

/**
 * Pure-CSS recreation of the PrepOS desktop. Avoids shipping a giant PNG and
 * keeps the marketing site under 200KB while still giving visitors a real
 * sense of how the product feels — traffic lights, glass widgets, dock with
 * magnification cue.
 */
export default function AppMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="ring-glow relative aspect-[16/11] w-full overflow-hidden rounded-2xl border border-white/10"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.55), transparent 50%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.45), transparent 55%), #0a0a14",
      }}
    >
      {/* Menubar */}
      <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-3 border-b border-white/10 bg-black/30 px-3 text-[11px] text-white/75 backdrop-blur-xl">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <span className="font-semibold text-white">PrepOS</span>
        <span className="text-white/55">Focus</span>
        <div className="ml-auto flex items-center gap-3 text-white/65">
          <span>🔎</span>
          <span>Tue 9:42 AM</span>
        </div>
      </div>

      {/* Widgets */}
      <div className="absolute inset-x-6 top-12 grid grid-cols-2 gap-3">
        <Widget
          accent="rgba(99,102,241,0.5)"
          icon={<Timer className="h-3 w-3" />}
          title="Focus · Today"
        >
          <div className="text-[22px] font-semibold tracking-tight text-white">2h 18m</div>
          <div className="text-[11px] text-white/55">Goal 3h · 76% complete</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "76%" }}
              transition={{ delay: 0.6, duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
            />
          </div>
        </Widget>

        <Widget
          accent="rgba(251,146,60,0.5)"
          icon={<Code2 className="h-3 w-3" />}
          title="Problem of the Day"
        >
          <div className="text-[13.5px] font-semibold leading-snug text-white">
            Longest Substring Without Repeating Characters
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-100">
            Medium
          </div>
        </Widget>

        <Widget
          accent="rgba(34,197,94,0.45)"
          icon={<ListTodo className="h-3 w-3" />}
          title="Today's Plan"
        >
          <ul className="space-y-1 text-[12px] text-white/85">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-emerald-400 bg-emerald-400/40" />
              Solve PoTD
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-white/30" />
              Mock interview 4 PM
            </li>
            <li className="flex items-center gap-2 text-white/55">
              <span className="h-3 w-3 rounded-full border border-white/20" />
              Review system design notes
            </li>
          </ul>
        </Widget>

        <Widget
          accent="rgba(236,72,153,0.5)"
          icon={<Newspaper className="h-3 w-3" />}
          title="Dev News"
        >
          <div className="space-y-1 text-[11px] text-white/85">
            <div className="truncate">→ How Vercel ships React Server Components</div>
            <div className="truncate text-white/65">→ Postgres 18: skip-locked patterns</div>
            <div className="truncate text-white/55">→ Inside the V8 sparkplug compiler</div>
          </div>
        </Widget>
      </div>

      {/* Streak chip */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute bottom-20 right-6 flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/15 px-2.5 py-1 text-[11px] text-orange-100 backdrop-blur"
      >
        <Flame className="h-3 w-3" />
        12-day streak
      </motion.div>

      {/* Dock */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <div className="flex items-end gap-1.5 rounded-2xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 backdrop-blur-xl">
          {DOCK_APPS.map((emoji, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.25, y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Widget({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="glass relative flex min-h-[110px] flex-col overflow-hidden rounded-xl p-3"
      style={{
        boxShadow: "0 12px 32px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-50 blur-2xl"
        style={{ background: accent }}
      />
      <div className="relative flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-white/55">
        <span className="text-white/75">{icon}</span>
        {title}
      </div>
      <div className="relative mt-2 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
