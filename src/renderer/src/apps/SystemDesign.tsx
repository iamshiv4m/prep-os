import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Database,
  Layers,
  Lightbulb,
  MessagesSquare,
  Network,
  PencilRuler,
  Search,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  SYSTEM_DESIGN_QUESTIONS,
  type SDDifficulty,
  type SDQuestion,
  type SDTopic,
} from "@shared/system-design-questions";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { openInApp } from "../utils/openInApp";
import clsx from "../utils/clsx";

const DIFFICULTY_ORDER: SDDifficulty[] = ["easy", "medium", "hard", "staff"];

const DIFFICULTY_META: Record<
  SDDifficulty,
  { label: string; color: string; pill: string; dot: string }
> = {
  easy: {
    label: "Easy",
    color: "#10b981",
    pill: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
    pill: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-400",
  },
  hard: {
    label: "Hard",
    color: "#ef4444",
    pill: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-400",
  },
  staff: {
    label: "Staff+",
    color: "#a855f7",
    pill: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    dot: "bg-violet-400",
  },
};

const TOPIC_META: Record<SDTopic, { label: string; icon: React.ReactNode }> = {
  messaging: { label: "Messaging", icon: <MessagesSquare className="h-3 w-3" /> },
  search: { label: "Search", icon: <Search className="h-3 w-3" /> },
  storage: { label: "Storage", icon: <Database className="h-3 w-3" /> },
  feed: { label: "Feed", icon: <Layers className="h-3 w-3" /> },
  geo: { label: "Geo", icon: <Target className="h-3 w-3" /> },
  video: { label: "Video", icon: <Zap className="h-3 w-3" /> },
  payments: { label: "Payments", icon: <Workflow className="h-3 w-3" /> },
  realtime: { label: "Realtime", icon: <Zap className="h-3 w-3" /> },
  data: { label: "Data", icon: <Database className="h-3 w-3" /> },
  ml: { label: "ML", icon: <Sparkles className="h-3 w-3" /> },
  infra: { label: "Infra", icon: <Network className="h-3 w-3" /> },
};

const ALL_DIFFICULTIES = "__all-diff__";
const ALL_TOPICS = "__all-topics__";
const ALL_COMPANIES = "__all-companies__";

export default function SystemDesign() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>(ALL_DIFFICULTIES);
  const [topic, setTopic] = useState<string>(ALL_TOPICS);
  const [company, setCompany] = useState<string>(ALL_COMPANIES);
  const [query, setQuery] = useState("");

  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);

  const allCompanies = useMemo(() => {
    const set = new Set<string>();
    SYSTEM_DESIGN_QUESTIONS.forEach((q) => q.company?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, []);

  const allTopics = useMemo<SDTopic[]>(() => {
    const set = new Set<SDTopic>();
    SYSTEM_DESIGN_QUESTIONS.forEach((q) => q.topics.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => TOPIC_META[a].label.localeCompare(TOPIC_META[b].label));
  }, []);

  const filtered = useMemo<SDQuestion[]>(() => {
    const q = query.trim().toLowerCase();
    return SYSTEM_DESIGN_QUESTIONS.filter((item) => {
      if (difficulty !== ALL_DIFFICULTIES && item.difficulty !== difficulty) return false;
      if (topic !== ALL_TOPICS && !item.topics.includes(topic as SDTopic)) return false;
      if (company !== ALL_COMPANIES && !(item.company ?? []).includes(company)) return false;
      if (!q) return true;
      const haystack = [
        item.title,
        item.summary,
        ...item.topics.map((t) => TOPIC_META[t].label),
        ...(item.company ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [difficulty, topic, company, query]);

  const selected = useMemo(
    () => SYSTEM_DESIGN_QUESTIONS.find((q) => q.id === selectedId) ?? null,
    [selectedId],
  );

  const excalidraw = useMemo(() => plugins.find((p) => p.id === "excalidraw"), [plugins]);
  const aiChat = useMemo(() => plugins.find((p) => p.id === "ai-chat"), [plugins]);

  const openExcalidraw = () => {
    if (!excalidraw) return;
    // Excalidraw is a webview plugin — launching it gives the user a blank
    // canvas to sketch their design. Future: pre-load a template per question.
    openApp(excalidraw);
  };

  const discussWithAI = () => {
    if (!aiChat) return;
    // AIChat currently only knows how to consume a `capture` from appState.
    // We just open it for now — once AIChat learns to read a `seedPrompt`,
    // we'll thread the question summary + requirements through here.
    openApp(aiChat);
  };

  return (
    <div className="flex h-full w-full bg-[#0d0d10] text-white">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-black/25 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/30 to-sky-500/30 ring-1 ring-white/10">
            <PencilRuler className="h-3.5 w-3.5 text-white/85" />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-white/90">System Design</div>
            <div className="truncate text-[10px] text-white/40">
              {SYSTEM_DESIGN_QUESTIONS.length} classic questions
            </div>
          </div>
        </div>

        <div className="px-3 pt-2">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, topic, company…"
              className="h-7 w-full rounded-md border border-white/10 bg-white/[0.04] pl-8 pr-2 text-[12px] text-white/90 placeholder:text-white/30 focus:border-white/20 focus:outline-none"
            />
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4 pt-3 text-[11px]">
          <FilterGroup label="Difficulty">
            <FilterPill
              active={difficulty === ALL_DIFFICULTIES}
              onClick={() => setDifficulty(ALL_DIFFICULTIES)}
              label="All"
            />
            {DIFFICULTY_ORDER.map((d) => (
              <FilterPill
                key={d}
                active={difficulty === d}
                onClick={() => setDifficulty(d)}
                label={DIFFICULTY_META[d].label}
                accentClass={DIFFICULTY_META[d].pill}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Topic">
            <FilterPill
              active={topic === ALL_TOPICS}
              onClick={() => setTopic(ALL_TOPICS)}
              label="All topics"
            />
            {allTopics.map((t) => (
              <FilterPill
                key={t}
                active={topic === t}
                onClick={() => setTopic(t)}
                label={TOPIC_META[t].label}
                icon={TOPIC_META[t].icon}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="Company">
            <FilterPill
              active={company === ALL_COMPANIES}
              onClick={() => setCompany(ALL_COMPANIES)}
              label="All companies"
            />
            {allCompanies.map((c) => (
              <FilterPill
                key={c}
                active={company === c}
                onClick={() => setCompany(c)}
                label={c}
                icon={<Building2 className="h-3 w-3" />}
              />
            ))}
          </FilterGroup>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <QuestionDetail
            question={selected}
            onBack={() => setSelectedId(null)}
            onOpenExcalidraw={openExcalidraw}
            excalidrawAvailable={!!excalidraw}
            onDiscussWithAI={discussWithAI}
            aiChatAvailable={!!aiChat}
          />
        ) : (
          <QuestionList items={filtered} onOpen={(id) => setSelectedId(id)} />
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 px-1 text-[10px] uppercase tracking-[0.12em] text-white/40">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  icon,
  accentClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  accentClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[10.5px] transition-colors",
        active
          ? accentClass ?? "border-white/30 bg-white/[0.12] text-white"
          : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white/90",
      )}
    >
      {icon && <span className="text-white/60">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function QuestionList({
  items,
  onOpen,
}: {
  items: SDQuestion[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black/25 px-4 text-[12px] text-white/70">
        <PencilRuler className="h-3.5 w-3.5 text-white/45" />
        <span className="font-medium text-white/85">All questions</span>
        <span className="text-white/35">· {items.length} matching</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/55">
            <Search className="h-6 w-6 text-white/30" />
            <div className="text-[13px]">No questions match this filter.</div>
            <div className="max-w-sm text-[12px] text-white/45">
              Clear a filter or try a different keyword.
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {items.map((q) => (
              <QuestionCard key={q.id} question={q} onOpen={() => onOpen(q.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ question, onOpen }: { question: SDQuestion; onOpen: () => void }) {
  const diff = DIFFICULTY_META[question.difficulty];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      <button onClick={onOpen} className="flex w-full flex-col items-start gap-2 text-left">
        <div className="flex w-full items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold leading-snug text-white/95">
              {question.title}
            </div>
          </div>
          <span
            className={clsx(
              "shrink-0 rounded-full border px-2 py-[2px] text-[10px] font-semibold tracking-wide",
              diff.pill,
            )}
          >
            {diff.label}
          </span>
        </div>
        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-white/65">
          {question.summary}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {question.topics.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-[2px] text-[10px] text-white/65"
            >
              {TOPIC_META[t].icon}
              {TOPIC_META[t].label}
            </span>
          ))}
          {question.company?.slice(0, 3).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-md border border-sky-400/20 bg-sky-500/10 px-1.5 py-[2px] text-[10px] text-sky-100"
            >
              <Building2 className="h-3 w-3" />
              {c}
            </span>
          ))}
        </div>
        <div className="mt-2 flex w-full items-center justify-end">
          <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-white/70 transition-colors group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">
            Open <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </button>
    </motion.li>
  );
}

function QuestionDetail({
  question,
  onBack,
  onOpenExcalidraw,
  excalidrawAvailable,
  onDiscussWithAI,
  aiChatAvailable,
}: {
  question: SDQuestion;
  onBack: () => void;
  onOpenExcalidraw: () => void;
  excalidrawAvailable: boolean;
  onDiscussWithAI: () => void;
  aiChatAvailable: boolean;
}) {
  const [hintsOpen, setHintsOpen] = useState(false);
  const diff = DIFFICULTY_META[question.difficulty];

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black/25 px-3 text-[12px]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to list
        </button>
        <span className="ml-2 truncate font-medium text-white/85">{question.title}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-6">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[11px] font-semibold tracking-wide",
                  diff.pill,
                )}
              >
                <span className={clsx("h-2 w-2 rounded-full", diff.dot)} aria-hidden />
                {diff.label}
              </span>
              {question.topics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-[3px] text-[11px] text-white/70"
                >
                  {TOPIC_META[t].icon}
                  {TOPIC_META[t].label}
                </span>
              ))}
              {question.company?.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 rounded-md border border-sky-400/20 bg-sky-500/10 px-2 py-[3px] text-[11px] text-sky-100"
                >
                  <Building2 className="h-3 w-3" />
                  {c}
                </span>
              ))}
            </div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-white">
              {question.title}
            </h1>
            <p className="text-[14px] leading-relaxed text-white/75">{question.summary}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={onOpenExcalidraw}
                disabled={!excalidrawAvailable}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  excalidrawAvailable
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-100 hover:border-violet-400/70 hover:bg-violet-500/25"
                    : "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/35",
                )}
                title={
                  excalidrawAvailable
                    ? "Open Excalidraw to sketch your design"
                    : "Excalidraw plugin not installed"
                }
              >
                <PencilRuler className="h-3.5 w-3.5" />
                Open Excalidraw
              </button>
              <button
                onClick={onDiscussWithAI}
                disabled={!aiChatAvailable}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  aiChatAvailable
                    ? "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:border-sky-400/70 hover:bg-sky-500/25"
                    : "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/35",
                )}
                title={
                  aiChatAvailable
                    ? "Discuss this question with AI"
                    : "AI Chat plugin not installed"
                }
              >
                <Sparkles className="h-3.5 w-3.5" />
                Discuss with AI
              </button>
            </div>
          </header>

          <Section title="Functional requirements">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[13px] leading-relaxed text-white/80">
              {question.requirements.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ol>
          </Section>

          <Section title="Non-functional requirements">
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[13px] leading-relaxed text-white/80">
              {question.nonFunctional.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ol>
          </Section>

          <Section
            title="Hints"
            action={
              <button
                onClick={() => setHintsOpen((v) => !v)}
                className="flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-100 transition-colors hover:border-amber-400/60 hover:bg-amber-500/20"
              >
                <Lightbulb className="h-3 w-3" />
                {hintsOpen ? "Hide hints" : "Show hints"}
              </button>
            }
          >
            <AnimatePresence initial={false}>
              {hintsOpen ? (
                <motion.ul
                  key="hints"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex list-disc flex-col gap-2 overflow-hidden pl-5 text-[13px] leading-relaxed text-white/80"
                >
                  {question.hints.map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </motion.ul>
              ) : (
                <p className="text-[12px] text-white/45">
                  Try designing first. Reveal hints when you&rsquo;re stuck.
                </p>
              )}
            </AnimatePresence>
          </Section>

          {question.references && question.references.length > 0 && (
            <Section title="References">
              <ul className="flex flex-col gap-1.5">
                {question.references.map((ref) => (
                  <li key={ref.url}>
                    <button
                      onClick={() => openInApp({ url: ref.url, title: ref.label })}
                      className="group inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[12px] text-white/75 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
                    >
                      {ref.label}
                      <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-white/55">
          {title}
        </h2>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
