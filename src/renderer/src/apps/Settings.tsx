import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  RotateCcw,
  Settings2,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import type { AIProvider, AppSettings, FocusSession } from "@shared/types";
import {
  formatDuration,
  perPluginMs,
  recentSessions,
  thisWeekMs,
  todayMs,
  useFocus,
} from "../store/focus";
import { useOnboarding, type Persona } from "../store/onboarding";

const DEFAULT: AppSettings = {
  aiProvider: "openai",
  openaiModel: "gpt-4o-mini",
  anthropicModel: "claude-3-5-sonnet-latest",
  theme: "system",
  wallpaper: "default",
  captureShortcut: "CommandOrControl+Shift+A",
  spotlightShortcut: "CommandOrControl+K",
  focusHardLock: false,
};

type Tab = "general" | "focus";

interface Props {
  initialTab?: string;
}

export default function Settings({ initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab === "focus" ? "focus" : "general");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [savedTick, setSavedTick] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await window.prepOS.settings.get();
      setSettings(s);
      const [o, a] = await Promise.all([
        window.prepOS.settings.getApiKey("openai"),
        window.prepOS.settings.getApiKey("anthropic"),
      ]);
      if (o) setOpenaiKey(o);
      if (a) setAnthropicKey(a);
    })();
  }, []);

  const updateField = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await window.prepOS.settings.update({ [key]: value });
    flashSaved(key as string);
  };

  const saveKey = async (provider: AIProvider, key: string) => {
    await window.prepOS.settings.setApiKey(provider, key);
    flashSaved(provider);
  };

  const flashSaved = (what: string) => {
    setSavedTick(what);
    setTimeout(() => setSavedTick((cur) => (cur === what ? null : cur)), 1400);
  };

  return (
    <div className="flex h-full w-full bg-neutral-950/80 text-white">
      <nav className="flex w-48 shrink-0 flex-col gap-1 border-r border-white/10 p-3">
        <TabButton active={tab === "general"} onClick={() => setTab("general")}>
          <KeyRound className="h-3.5 w-3.5" /> General
        </TabButton>
        <TabButton active={tab === "focus"} onClick={() => setTab("focus")}>
          <Target className="h-3.5 w-3.5" /> Focus
        </TabButton>
      </nav>
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "general" && (
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-3 flex items-center gap-2 text-[13px] uppercase tracking-wide text-white/55">
                <KeyRound className="h-3.5 w-3.5" /> AI API Keys (stored encrypted via OS keychain)
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <label className="mb-2 block text-[12px] font-medium text-white/80">
                    OpenAI API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showOpenAI ? "text" : "password"}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="h-9 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-[13px] outline-none focus:border-white/25"
                    />
                    <button
                      onClick={() => setShowOpenAI((v) => !v)}
                      className="rounded-md border border-white/10 bg-white/5 p-1.5 hover:bg-white/10"
                    >
                      {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => saveKey("openai", openaiKey)}
                      className="rounded-md bg-blue-500 px-3 py-1.5 text-[12px] font-medium hover:bg-blue-400"
                    >
                      Save
                    </button>
                    {savedTick === "openai" && <Check className="h-4 w-4 text-green-400" />}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <label className="mb-2 block text-[12px] font-medium text-white/80">
                    Anthropic API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showAnthropic ? "text" : "password"}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="h-9 flex-1 rounded-md border border-white/10 bg-black/30 px-3 text-[13px] outline-none focus:border-white/25"
                    />
                    <button
                      onClick={() => setShowAnthropic((v) => !v)}
                      className="rounded-md border border-white/10 bg-white/5 p-1.5 hover:bg-white/10"
                    >
                      {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => saveKey("anthropic", anthropicKey)}
                      className="rounded-md bg-blue-500 px-3 py-1.5 text-[12px] font-medium hover:bg-blue-400"
                    >
                      Save
                    </button>
                    {savedTick === "anthropic" && <Check className="h-4 w-4 text-green-400" />}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 text-[13px] uppercase tracking-wide text-white/55">
                AI Provider
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={settings.aiProvider}
                  onChange={(e) => updateField("aiProvider", e.target.value as AIProvider)}
                  className="h-9 rounded-md border border-white/10 bg-black/30 px-3 text-[13px] outline-none"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
                {settings.aiProvider === "openai" ? (
                  <input
                    value={settings.openaiModel}
                    onChange={(e) => updateField("openaiModel", e.target.value)}
                    className="h-9 w-60 rounded-md border border-white/10 bg-black/30 px-3 text-[13px] outline-none"
                  />
                ) : (
                  <input
                    value={settings.anthropicModel}
                    onChange={(e) => updateField("anthropicModel", e.target.value)}
                    className="h-9 w-60 rounded-md border border-white/10 bg-black/30 px-3 text-[13px] outline-none"
                  />
                )}
                {savedTick === "aiProvider" && <Check className="h-4 w-4 text-green-400" />}
              </div>
              <p className="mt-2 text-[11px] text-white/45">
                Suggested OpenAI: <code>gpt-4o-mini</code>, <code>gpt-4o</code>. Suggested
                Anthropic: <code>claude-3-5-sonnet-latest</code>.
              </p>
            </section>

            <section>
              <div className="mb-3 text-[13px] uppercase tracking-wide text-white/55">
                Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <div className="text-white/70">Capture region → AI</div>
                  <kbd className="mt-1 inline-block rounded border border-white/20 bg-black/50 px-2 py-0.5 text-[11px]">
                    {settings.captureShortcut}
                  </kbd>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <div className="text-white/70">Spotlight / Command Palette</div>
                  <kbd className="mt-1 inline-block rounded border border-white/20 bg-black/50 px-2 py-0.5 text-[11px]">
                    {settings.spotlightShortcut}
                  </kbd>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-white/45">
                Custom shortcuts coming soon. For now defaults apply.
              </p>
            </section>

            <PersonalizeSection />

            <section>
              <div className="mb-3 text-[13px] uppercase tracking-wide text-white/55">About</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[12px] leading-relaxed text-white/65">
                  PrepOS — a desktop cockpit for tech interview prep. Plugin driven,
                  screenshot-to-AI workflow, Monaco playground, Markdown notes. Built with Electron
                  + React.
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <FeedbackLink
                    href="https://github.com/iamshiv4m/prep-os/issues/new/choose"
                    label="Report a bug"
                  />
                  <FeedbackLink
                    href="https://github.com/iamshiv4m/prep-os/discussions"
                    label="Discussions"
                  />
                  <FeedbackLink
                    href="https://github.com/iamshiv4m/prep-os/releases"
                    label="What's new"
                  />
                  <FeedbackLink href="mailto:shivamjha190@gmail.com" label="Email feedback" />
                </div>
                <div className="mt-3 text-[10.5px] leading-relaxed text-white/40">
                  PrepOS is open-source (MIT) and runs entirely on your machine. No telemetry, no
                  analytics, no account — your API keys stay in the OS keychain.
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === "focus" && <FocusTab />}
      </div>
    </div>
  );
}

/**
 * Small inline link used in the About section. Routes through the IPC
 * `openExternal` helper so the URL opens in the user's real browser instead
 * of trapping them inside an Electron webview.
 */
function FeedbackLink({ href, label }: { href: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        void window.prepOS.openExternal(href).catch(() => {});
      }}
      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white"
    >
      {label}
    </button>
  );
}

/**
 * Lets users see which persona they picked at first-run and re-trigger the
 * welcome wizard. Reset just clears the onboarding store — `<PersonaPicker />`
 * mounted in App.tsx will instantly re-open because its `open` flag tracks
 * `onboarding.completed`.
 */
function PersonalizeSection() {
  const persona = useOnboarding((s) => s.persona);
  const completed = useOnboarding((s) => s.completed);
  const reset = useOnboarding((s) => s.reset);

  const meta: Record<Persona, { label: string; icon: React.ReactNode; accent: string }> = {
    student: {
      label: "College student",
      icon: <GraduationCap className="h-4 w-4" />,
      accent: "#6366f1",
    },
    professional: {
      label: "Working professional",
      icon: <Briefcase className="h-4 w-4" />,
      accent: "#8b5cf6",
    },
    custom: {
      label: "Custom (no preset)",
      icon: <Settings2 className="h-4 w-4" />,
      accent: "#64748b",
    },
  };

  const current = persona ? meta[persona] : null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-[13px] uppercase tracking-wide text-white/55">
        <Sparkles className="h-3.5 w-3.5" /> Personalize
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={
                current
                  ? {
                      backgroundColor: `${current.accent}22`,
                      color: current.accent,
                      boxShadow: `inset 0 0 0 1px ${current.accent}55`,
                    }
                  : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }
              }
            >
              {current?.icon ?? <Sparkles className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-white/90">
                {current ? `Setup: ${current.label}` : "Setup not chosen yet"}
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/55">
                {completed
                  ? "Re-run the welcome wizard to switch your persona or re-launch the starter mode."
                  : "Open the welcome wizard to pick a persona and pre-load a study mode."}
              </div>
            </div>
          </div>
          <button
            onClick={() => reset()}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/85 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            {completed ? "Re-run wizard" : "Open wizard"}
          </button>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-[12px] transition-colors ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
      }`}
    >
      {children}
    </button>
  );
}

function FocusTab() {
  const sessions = useFocus((s) => s.sessions);
  const refresh = useFocus((s) => s.refresh);
  const clearHistory = useFocus((s) => s.clearHistory);
  const hardLock = useFocus((s) => s.hardLock);
  const setHardLock = useFocus((s) => s.setHardLock);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const today = useMemo(() => todayMs(sessions), [sessions]);
  const week = useMemo(() => thisWeekMs(sessions), [sessions]);
  const perPlugin = useMemo(() => perPluginMs(sessions).slice(0, 5), [sessions]);
  const recent = useMemo(() => recentSessions(sessions, 30), [sessions]);
  const maxPerPlugin = perPlugin[0]?.durationMs ?? 0;

  const handleClear = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    await clearHistory();
    setConfirming(false);
  };

  const toggleHardLock = async () => {
    const next = !hardLock;
    setHardLock(next);
    await window.prepOS.settings.update({ focusHardLock: next });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${hardLock ? "bg-emerald-500/20 text-emerald-200" : "bg-white/5 text-white/60"}`}
          >
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-white/90">Hard focus mode</div>
            <div className="mt-0.5 text-[11px] leading-snug text-white/55">
              Blocks quitting PrepOS while a session is running. A confirmation dialog appears on
              Cmd+Q. End the session to regain normal control.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleHardLock}
          aria-pressed={hardLock}
          aria-label={hardLock ? "Disable hard focus mode" : "Enable hard focus mode"}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 ${hardLock ? "bg-emerald-400/80" : "bg-white/15"}`}
        >
          <span
            aria-hidden
            className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out ${hardLock ? "left-[19px]" : "left-[3px]"}`}
          />
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Today" value={formatDuration(today)} accent />
        <StatCard label="Last 7 days" value={formatDuration(week)} />
      </section>

      <section>
        <div className="mb-3 text-[13px] uppercase tracking-wide text-white/55">Top apps</div>
        {perPlugin.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 px-4 py-8 text-center text-[12px] text-white/50">
            No focus sessions yet. Click the{" "}
            <span className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-white/80">
              <Target className="h-3 w-3" /> Focus
            </span>{" "}
            button in the menubar to start one.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {perPlugin.map((p) => {
              const ratio = maxPerPlugin > 0 ? p.durationMs / maxPerPlugin : 0;
              return (
                <div
                  key={p.pluginId}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.pluginIcon ?? "•"}</span>
                      <span className="text-white/85">{p.pluginName}</span>
                    </div>
                    <span className="tabular-nums text-white/60">
                      {formatDuration(p.durationMs)}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-emerald-400/70"
                      style={{ width: `${Math.max(4, Math.round(ratio * 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between text-[13px] uppercase tracking-wide text-white/55">
          <span>Recent sessions</span>
          {sessions.length > 0 && (
            <button
              onClick={handleClear}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                confirming
                  ? "border-red-400/50 bg-red-500/20 text-red-200 hover:bg-red-500/30"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Trash2 className="h-3 w-3" />
              {confirming ? "Click again to confirm" : "Clear history"}
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 px-4 py-6 text-center text-[12px] text-white/45">
            No sessions recorded yet.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-md border border-white/10">
            {recent.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        accent ? "border-emerald-400/20 bg-emerald-500/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-white/55">{label}</div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          accent ? "text-emerald-200" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: FocusSession }) {
  const started = new Date(session.startedAt);
  const relative = formatRelative(session.startedAt);
  const startedLabel = `${relative} · ${started.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
  return (
    <div className="flex items-center gap-3 bg-white/[0.02] px-3 py-2 text-[12px]">
      <span className="text-base">{session.pluginIcon ?? "•"}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-white/85">{session.pluginName}</div>
        <div className="text-[11px] text-white/45">{startedLabel}</div>
      </div>
      <div className="tabular-nums text-white/70">{formatDuration(session.durationMs)}</div>
    </div>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}
