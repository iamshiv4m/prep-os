import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Home,
  Loader2,
  PanelLeft,
  RotateCw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PluginManifest, PluginSection } from "@shared/types";
import { openInApp } from "../utils/openInApp";
import clsx from "../utils/clsx";

interface Props {
  plugin: PluginManifest;
  winId?: string;
}

type ElectronWebView = HTMLElement & {
  src: string;
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  getURL: () => string;
  getTitle?: () => string;
  insertCSS: (css: string) => Promise<string>;
  addEventListener: (ev: string, cb: (e: Event) => void) => void;
  removeEventListener: (ev: string, cb: (e: Event) => void) => void;
  partition: string;
};

const BASE_INJECT = `
  html, body { background-color: #0d0d10; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
  ::-webkit-scrollbar-track { background: transparent; }
`;

function hostnameFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function matchSection(section: PluginSection, current: string): boolean {
  if (!current) return false;
  if (section.matchPrefix) return current.startsWith(section.url);
  return current === section.url;
}

export default function WebviewHost({ plugin, winId }: Props) {
  const url = plugin.entry;
  const injectCSS = plugin.injectCSS;
  const sections = useMemo(() => plugin.sections ?? [], [plugin.sections]);
  const hasSidebar = sections.length > 0;

  const ref = useRef<ElectronWebView | null>(null);
  const [current, setCurrent] = useState(url);
  const [title, setTitle] = useState<string>(() => hostnameFor(url));
  const [loading, setLoading] = useState(true);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(url);
  const [sidebarOpen, setSidebarOpen] = useState(hasSidebar);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStart = () => setLoading(true);
    const onStop = () => {
      setLoading(false);
      try {
        const u = el.getURL();
        setCurrent(u);
        setAddressInput(u);
        setCanBack(el.canGoBack());
        setCanForward(el.canGoForward());
        const combined = `${BASE_INJECT}\n${injectCSS ?? ""}`;
        void el.insertCSS(combined);
        const t = el.getTitle?.();
        if (t && t.trim().length > 0) setTitle(t);
      } catch {
        /* ignore */
      }
    };
    const onTitle = (e: Event) => {
      const ev = e as Event & { title?: string };
      if (ev.title && ev.title.trim().length > 0) setTitle(ev.title);
    };
    const onNavigate = () => {
      try {
        setCurrent(el.getURL());
        setAddressInput(el.getURL());
      } catch {
        /* ignore */
      }
    };
    const onNewWindow = (e: Event) => {
      const ev = e as Event & { url?: string };
      (e as unknown as { preventDefault?: () => void }).preventDefault?.();
      if (ev.url) openInApp({ url: ev.url });
    };

    el.addEventListener("did-start-loading", onStart);
    el.addEventListener("did-stop-loading", onStop);
    el.addEventListener("page-title-updated", onTitle);
    el.addEventListener("did-navigate", onNavigate);
    el.addEventListener("did-navigate-in-page", onNavigate);
    el.addEventListener("new-window", onNewWindow);

    return () => {
      el.removeEventListener("did-start-loading", onStart);
      el.removeEventListener("did-stop-loading", onStop);
      el.removeEventListener("page-title-updated", onTitle);
      el.removeEventListener("did-navigate", onNavigate);
      el.removeEventListener("did-navigate-in-page", onNavigate);
      el.removeEventListener("new-window", onNewWindow);
    };
  }, [injectCSS]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setShowAddress(true);
      } else if (mod && e.key === "\\") {
        e.preventDefault();
        if (hasSidebar) setSidebarOpen((v) => !v);
      } else if (e.key === "Escape") {
        setShowAddress(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasSidebar]);

  useEffect(() => {
    if (!winId) return;
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ winId: string; url: string }>;
      if (!ev.detail || ev.detail.winId !== winId) return;
      const target = ev.detail.url;
      if (!ref.current || !target) return;
      const normalized = /^https?:\/\//i.test(target) ? target : `https://${target}`;
      ref.current.src = normalized;
    };
    window.addEventListener("prepos:navigate", handler as EventListener);
    return () => window.removeEventListener("prepos:navigate", handler as EventListener);
  }, [winId]);

  const navigate = (target: string) => {
    if (!ref.current) return;
    const normalized = /^https?:\/\//i.test(target) ? target : `https://${target}`;
    ref.current.src = normalized;
    setShowAddress(false);
  };

  const host = hostnameFor(current);
  const activeSectionId = useMemo(() => {
    const match = sections.find((s) => matchSection(s, current));
    return match?.id;
  }, [sections, current]);

  return (
    <div className="relative flex h-full w-full bg-[#0d0d10]">
      {hasSidebar && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 188 : 0, opacity: sidebarOpen ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
          className="relative shrink-0 overflow-hidden border-r border-white/[0.06] bg-black/25 backdrop-blur-xl"
        >
          <div className="flex h-full w-[188px] flex-col">
            <div className="flex items-center gap-2 px-3 pb-2 pt-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.08] text-base ring-1 ring-white/10">
                <span className="leading-none">{plugin.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-white/90">
                  {plugin.name}
                </div>
                <div className="truncate text-[10px] text-white/40">{host}</div>
              </div>
            </div>
            <nav className="flex flex-col gap-0.5 px-2 pb-3 pt-1">
              {sections.map((section) => {
                const active = section.id === activeSectionId;
                return (
                  <button
                    key={section.id}
                    onClick={() => navigate(section.url)}
                    className={clsx(
                      "group flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] transition-colors",
                      active
                        ? "bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "text-white/70 hover:bg-white/[0.06] hover:text-white/95",
                    )}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[13px] leading-none">
                      {section.icon ?? "•"}
                    </span>
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.aside>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="relative flex h-9 shrink-0 items-center gap-1 border-b border-white/5 bg-black/30 px-2">
          {hasSidebar && (
            <ToolbarBtn
              label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <PanelLeft
                className={clsx(
                  "h-3.5 w-3.5 transition-colors",
                  sidebarOpen ? "text-white/85" : "text-white/50",
                )}
              />
            </ToolbarBtn>
          )}

          <div className="mx-1 flex h-6 items-center gap-1.5 rounded-md bg-white/[0.05] px-2 text-[11px] ring-1 ring-white/[0.06]">
            <span className="text-[13px] leading-none">{plugin.icon}</span>
            <span className="font-semibold text-white/85">{plugin.name}</span>
          </div>

          <ToolbarBtn label="Back" disabled={!canBack} onClick={() => ref.current?.goBack()}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            label="Forward"
            disabled={!canForward}
            onClick={() => ref.current?.goForward()}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn label="Reload" onClick={() => ref.current?.reload()}>
            <RotateCw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} />
          </ToolbarBtn>

          <button
            onClick={() => setShowAddress((v) => !v)}
            title="Show URL (⌘L)"
            className="mx-1 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent bg-white/[0.04] px-3 py-0.5 text-[11px] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white/90"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin text-white/50" />
            ) : (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70" />
            )}
            <span className="truncate font-medium text-white/85">{title || host}</span>
            <span className="hidden truncate text-white/40 sm:inline">· {host}</span>
          </button>

          <ToolbarBtn label="Home" onClick={() => navigate(url)}>
            <Home className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn label="Open in browser" onClick={() => window.prepOS.openExternal(current)}>
            <ExternalLink className="h-3.5 w-3.5" />
          </ToolbarBtn>

          {loading && (
            <motion.div
              key="progress"
              className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden"
            >
              <motion.div
                initial={{ x: "-40%" }}
                animate={{ x: "140%" }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
              />
            </motion.div>
          )}
        </div>

        {showAddress && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(addressInput);
            }}
            className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-1.5"
          >
            <span className="text-[11px] uppercase tracking-wider text-white/35">URL</span>
            <input
              autoFocus
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onBlur={() => setShowAddress(false)}
              className="h-6 flex-1 rounded-md border border-white/10 bg-black/40 px-2 text-[11px] text-white/90 outline-none focus:border-white/25"
            />
            <button
              type="button"
              onClick={() => setShowAddress(false)}
              className="rounded px-2 py-0.5 text-[11px] text-white/50 hover:text-white"
            >
              Esc
            </button>
          </form>
        )}

        <webview
          ref={(el: HTMLElement | null) => {
            ref.current = (el as unknown as ElectronWebView) ?? null;
          }}
          src={url}
          partition={`persist:${plugin.id}`}
          // @ts-expect-error allowpopups is a valid <webview> attribute but not in React typings
          allowpopups="true"
          style={{
            flex: 1,
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#0d0d10",
          }}
        />
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-md text-white/70 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-30"
          : "hover:bg-white/10 hover:text-white active:bg-white/15",
      )}
    >
      {children}
    </button>
  );
}
