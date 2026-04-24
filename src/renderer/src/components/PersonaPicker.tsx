import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, GraduationCap, Briefcase, Settings2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useOnboarding, type Persona } from "../store/onboarding";
import { useModes, type StudyMode } from "../store/modes";
import { useFocus } from "../store/focus";
import { useNotifications } from "../store/notifications";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import clsx from "../utils/clsx";

type PersonaCard = {
  id: Persona;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  /** What we'll auto-launch on selection — kept in sync with `studymodes.ts`. */
  starterModeId: string | null;
  /** One-line summary of what selecting this persona actually does. */
  effectSummary: string;
  bullets: string[];
  accent: string;
};

const PERSONAS: PersonaCard[] = [
  {
    id: "student",
    title: "College student",
    subtitle: "Placement season, contests, DSA grind",
    icon: <GraduationCap className="h-5 w-5" />,
    starterModeId: "placement",
    effectSummary: "Launches Placement Prep mode (LeetCode + Notes + AI) with a 2-hour daily goal.",
    bullets: [
      "LeetCode, HackerRank, GfG/Striver in the feed",
      "Problem-of-the-Day on the desktop",
      "Focus tracker with hard-lock for distraction-free DSA",
    ],
    accent: "#6366f1",
  },
  {
    id: "professional",
    title: "Working professional",
    subtitle: "Switching companies, system design, behavioral",
    icon: <Briefcase className="h-5 w-5" />,
    starterModeId: "project",
    effectSummary:
      "Launches Project Work mode (GitHub + Excalidraw + AI + Playground) for design-focused prep.",
    bullets: [
      "Excalidraw for system design sketches",
      "ByteByteGo, High Scalability, Netflix engineering in feed",
      "AI chat with screenshot capture for code review",
    ],
    accent: "#8b5cf6",
  },
  {
    id: "custom",
    title: "I'll set it up myself",
    subtitle: "Skip — show me a clean desktop",
    icon: <Settings2 className="h-5 w-5" />,
    starterModeId: null,
    effectSummary:
      "Closes this picker. Reopen later from Settings → Personalize to change your mind.",
    bullets: [
      "No mode auto-launches",
      "All apps available in the dock + Launchpad",
      "Open ⌘⇧M anytime to pick a study mode",
    ],
    accent: "#64748b",
  },
];

export default function PersonaPicker() {
  const completed = useOnboarding((s) => s.completed);
  const setPersona = useOnboarding((s) => s.setPersona);

  const setActiveMode = useModes((s) => s.setActive);
  const modesById = useMemo(() => {
    const map = new Map<string, StudyMode>();
    useModes.getState().modes.forEach((m) => map.set(m.id, m));
    return map;
  }, []);

  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);
  const startFocus = useFocus((s) => s.start);
  const setHardLock = useFocus((s) => s.setHardLock);
  const focusActive = useFocus((s) => s.active);
  const pushNotification = useNotifications((s) => s.push);

  // Same staggering trick the ModePicker uses — clear pending timers if the
  // component unmounts mid-launch (React StrictMode double-invocation is a
  // real risk here on first run).
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const open = !completed;

  // Allow Esc to dismiss → counts as choosing "custom" (don't trap the user).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        choose("custom");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (id: Persona) => {
    const card = PERSONAS.find((p) => p.id === id);
    if (!card) return;
    setPersona(id);

    if (!card.starterModeId) {
      pushNotification({
        kind: "system",
        icon: "👋",
        title: "Welcome to PrepOS",
        body: "Open ⌘⇧M anytime to launch a study mode, or ⌘L for the Launchpad.",
      });
      return;
    }

    const mode = modesById.get(card.starterModeId);
    if (!mode) return;

    setActiveMode(mode.id);

    const pluginsById = new Map(plugins.map((p) => [p.id, p]));
    const toOpen = mode.defaultApps
      .map((pid) => pluginsById.get(pid))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    toOpen.slice(0, 4).forEach((plugin, idx) => {
      const t = setTimeout(() => openApp(plugin), idx * 90 + 250);
      timersRef.current.push(t);
    });

    if (mode.focus.enabled && !focusActive) {
      setHardLock(mode.focus.hardLock);
      const target = toOpen[0];
      if (target) {
        const t = setTimeout(() => startFocus(target), toOpen.length * 90 + 600);
        timersRef.current.push(t);
      }
    }

    pushNotification({
      kind: "system",
      icon: card.id === "student" ? "🎓" : "💼",
      title: `Welcome — ${card.title} setup applied`,
      body: `${mode.name} mode activated · ${toOpen.length} apps opening${
        mode.dailyGoalMins ? ` · goal ${mode.dailyGoalMins}m today` : ""
      }`,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9800] flex items-center justify-center bg-black/65 backdrop-blur-md"
          // No outside click — first-run is intentional. Esc still works.
        >
          <motion.div
            initial={{ scale: 0.96, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative w-[860px] max-w-[94vw] overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(circle at 20% 0%, rgba(99,102,241,0.18), transparent 45%), radial-gradient(circle at 90% 20%, rgba(139,92,246,0.18), transparent 50%)",
              }}
            />

            <div className="relative px-8 pb-2 pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-violet-100/85">
                <Sparkles className="h-3 w-3" />
                <span>Welcome to PrepOS</span>
              </div>
              <h2 className="mt-4 text-balance text-[26px] font-semibold leading-tight tracking-[-0.01em] text-white sm:text-[30px]">
                What brings you here?
              </h2>
              <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-white/60">
                Pick the role that best matches you and we&apos;ll pre-load a study mode and the
                feeds that fit. You can change it anytime from{" "}
                <kbd className="inline-block whitespace-nowrap rounded border border-white/20 bg-white/10 px-1.5 py-[1px] text-[10.5px] font-medium tracking-wide text-white/85">
                  ⌘⇧M
                </kbd>{" "}
                or Settings → Personalize.
              </p>
            </div>

            <div className="relative grid grid-cols-1 gap-3 px-8 py-6 md:grid-cols-3">
              {PERSONAS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => choose(p.id)}
                  autoFocus={i === 0}
                  className={clsx(
                    "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left transition-all",
                    "hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.05]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
                  )}
                  style={{
                    boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.02)`,
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-50 blur-2xl transition-opacity group-hover:opacity-80"
                    style={{ backgroundColor: `${p.accent}55` }}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${p.accent}20`,
                        boxShadow: `inset 0 0 0 1px ${p.accent}55`,
                        color: p.accent,
                      }}
                    >
                      {p.icon}
                    </span>
                    <span className="mt-1 shrink-0 whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-white/35">
                      {p.id === "custom" ? "Skip" : "Quick start"}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="text-[15px] font-semibold text-white">{p.title}</div>
                    <div className="mt-0.5 text-[11.5px] text-white/55">{p.subtitle}</div>
                  </div>

                  <ul className="relative mt-1 space-y-1.5 text-[12px] leading-relaxed text-white/65">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5">
                        <span
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: p.accent }}
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-auto flex items-start justify-between gap-3 border-t border-white/[0.06] pt-3 text-[11px] leading-snug text-white/45">
                    <span className="line-clamp-2 italic">{p.effectSummary}</span>
                    <ArrowRight
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 translate-x-0 transition-transform group-hover:translate-x-1"
                      style={{ color: p.accent }}
                    />
                  </div>
                </button>
              ))}
            </div>

            <div className="relative flex items-center justify-between border-t border-white/[0.06] px-8 py-3.5 text-[11px] text-white/45">
              <span>You can change this anytime — none of it is locked in.</span>
              <span>
                <kbd className="inline-block rounded border border-white/20 bg-white/10 px-1.5 py-[1px] text-[10.5px] font-medium tracking-wide text-white/85">
                  Esc
                </kbd>{" "}
                to skip
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
