import {
  BookOpen,
  Brain,
  Code2,
  Flame,
  Lock,
  Newspaper,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import type { ReactNode } from "react";

interface Feature {
  title: string;
  body: string;
  icon: ReactNode;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    title: "Focus tracker",
    body: "Pomodoro-style sessions tied to any prep app. Hard-lock mode blocks Cmd+Q until your session ends — useful for the 4 AM grind.",
    icon: <Timer className="h-4 w-4" />,
    accent: "from-indigo-500/30 to-violet-500/0",
  },
  {
    title: "Problem of the day",
    body: "Curated DSA rotation across topics — arrays, DP, graphs, system design. One click opens it inside the in-app browser.",
    icon: <Code2 className="h-4 w-4" />,
    accent: "from-amber-500/30 to-orange-500/0",
  },
  {
    title: "AI chat with vision",
    body: "Cmd+Shift+A captures any region of your screen and pipes it into GPT-4o or Claude 3.5 Sonnet — perfect for stuck-on-a-problem moments.",
    icon: <Sparkles className="h-4 w-4" />,
    accent: "from-fuchsia-500/30 to-pink-500/0",
  },
  {
    title: "Dev news, in one place",
    body: "Hacker News, Dev.to, GitHub Trending, freeCodeCamp, ByteByteGo, plus India interview-prep staples (GfG, Striver, NeetCode, InterviewBit). One calm reader, no infinite scroll trap.",
    icon: <Newspaper className="h-4 w-4" />,
    accent: "from-rose-500/30 to-red-500/0",
  },
  {
    title: "Modes for every season",
    body: "Pick a persona on first launch — college student or working pro — and PrepOS pre-loads a matching dock, feed pack, and focus goal. Switch modes (Placement Sprint, System Design Week, Internship Hunt) in one keystroke.",
    icon: <Target className="h-4 w-4" />,
    accent: "from-emerald-500/30 to-teal-500/0",
  },
  {
    title: "Lockdown mode",
    body: "When deadlines loom, lockdown locks the OS shell — no app switching, kiosk mode, no distractions. Unlock with an explicit confirm dialog.",
    icon: <Lock className="h-4 w-4" />,
    accent: "from-amber-500/30 to-yellow-500/0",
  },
  {
    title: "Streaks + tasks",
    body: "Daily streak counter and a quick-add task list right on the desktop. Plan the day in 30 seconds, glance at progress all day.",
    icon: <Flame className="h-4 w-4" />,
    accent: "from-orange-500/30 to-red-500/0",
  },
  {
    title: "Notes + Monaco playground",
    body: "Markdown notes (with capture attach) and a built-in Monaco editor for rapid 'try this snippet' moments — no leaving the app.",
    icon: <BookOpen className="h-4 w-4" />,
    accent: "from-sky-500/30 to-blue-500/0",
  },
  {
    title: "Plug-in any platform",
    body: "Add LeetCode, GFG, HackerRank, Excalidraw, anything — they run as sandboxed webviews inside PrepOS with persistent logins.",
    icon: <Brain className="h-4 w-4" />,
    accent: "from-violet-500/30 to-purple-500/0",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-violet-300">Why PrepOS</div>
          <h2 className="mt-3 text-[36px] font-semibold leading-tight tracking-[-0.015em] text-white sm:text-[44px]">
            One desktop. Every prep tool.
            <br />
            <span className="text-white/55">Zero context switches.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Tabs, notebooks, half-finished problems, three Notion docs — sound familiar? PrepOS
            collapses your prep stack into a single OS-style shell so you stop juggling and start
            shipping.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border-white/8 group relative overflow-hidden rounded-2xl border bg-white/[0.025] p-6 transition-colors hover:border-white/15 hover:bg-white/[0.045]"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${f.accent} opacity-60 blur-2xl transition-opacity group-hover:opacity-100`}
              />
              <div className="relative">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/85">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-[15.5px] font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
