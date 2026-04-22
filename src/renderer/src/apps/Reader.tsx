import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ExternalLink, Loader2, RotateCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWindows, type WindowState } from "../store/windows";
import { openInApp } from "../utils/openInApp";
import clsx from "../utils/clsx";

interface Props {
  win: WindowState;
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

const READER_INJECT = `
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

export default function Reader({ win }: Props) {
  const url = useMemo(() => {
    const raw = win.appState?.url;
    return typeof raw === "string" ? raw : "about:blank";
  }, [win.appState?.url]);
  const initialTitle = useMemo(() => {
    const raw = win.appState?.title;
    return typeof raw === "string" && raw.trim().length > 0 ? raw : hostnameFor(url);
  }, [win.appState?.title, url]);
  const sourceName = useMemo(() => {
    const raw = win.appState?.sourceName;
    return typeof raw === "string" ? raw : undefined;
  }, [win.appState?.sourceName]);
  const sourceIcon = useMemo(() => {
    const raw = win.appState?.sourceIcon;
    return typeof raw === "string" ? raw : undefined;
  }, [win.appState?.sourceIcon]);

  const setWindowTitle = useWindows((s) => s.setWindowTitle);

  const ref = useRef<ElectronWebView | null>(null);
  const [current, setCurrent] = useState(url);
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading] = useState(true);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);
  const [failure, setFailure] = useState<{ host: string; code: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStart = () => {
      setLoading(true);
      setFailure(null);
    };
    const onStop = () => {
      setLoading(false);
      try {
        const u = el.getURL();
        setCurrent(u);
        setCanBack(el.canGoBack());
        setCanForward(el.canGoForward());
        void el.insertCSS(READER_INJECT);
        const t = el.getTitle?.();
        if (t && t.trim().length > 0) {
          setTitle(t);
          setWindowTitle(win.id, t);
        }
      } catch {
        /* ignore */
      }
    };
    const onTitle = (e: Event) => {
      const ev = e as Event & { title?: string };
      if (ev.title && ev.title.trim().length > 0) {
        setTitle(ev.title);
        setWindowTitle(win.id, ev.title);
      }
    };
    const onNavigate = () => {
      try {
        setCurrent(el.getURL());
        setCanBack(el.canGoBack());
        setCanForward(el.canGoForward());
      } catch {
        /* ignore */
      }
    };
    const onFailLoad = (e: Event) => {
      const ev = e as Event & {
        errorCode?: number;
        isMainFrame?: boolean;
        validatedURL?: string;
      };
      if (ev.isMainFrame === false) return;
      // -3 = ABORTED (usually user-initiated nav), -27 = BLOCKED_BY_RESPONSE → still show
      if (ev.errorCode === -3) return;
      setLoading(false);
      setFailure({
        host: hostnameFor(ev.validatedURL ?? current ?? url),
        code: ev.errorCode ?? 0,
      });
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
    el.addEventListener("did-fail-load", onFailLoad);
    el.addEventListener("new-window", onNewWindow);

    return () => {
      el.removeEventListener("did-start-loading", onStart);
      el.removeEventListener("did-stop-loading", onStop);
      el.removeEventListener("page-title-updated", onTitle);
      el.removeEventListener("did-navigate", onNavigate);
      el.removeEventListener("did-navigate-in-page", onNavigate);
      el.removeEventListener("did-fail-load", onFailLoad);
      el.removeEventListener("new-window", onNewWindow);
    };
  }, [url, win.id, setWindowTitle, current]);

  useEffect(() => {
    if (initialTitle) setWindowTitle(win.id, initialTitle);
  }, [initialTitle, setWindowTitle, win.id]);

  const host = hostnameFor(current);

  const reload = () => {
    setFailure(null);
    ref.current?.reload();
  };

  const openExternal = () => {
    void window.prepOS.openExternal(current);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[#0d0d10]">
      <div className="relative flex h-9 shrink-0 items-center gap-1 border-b border-white/5 bg-black/30 px-2">
        <div className="mx-1 flex h-6 items-center gap-1.5 rounded-md bg-white/[0.05] px-2 text-[11px] ring-1 ring-white/[0.06]">
          <span className="text-[13px] leading-none">{sourceIcon ?? "📖"}</span>
          <span className="font-semibold text-white/85">{sourceName ?? "Reader"}</span>
        </div>

        <ToolbarBtn label="Back" disabled={!canBack} onClick={() => ref.current?.goBack()}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Forward" disabled={!canForward} onClick={() => ref.current?.goForward()}>
          <ArrowRight className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Reload" onClick={reload}>
          <RotateCw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} />
        </ToolbarBtn>

        <div className="mx-1 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent bg-white/[0.04] px-3 py-0.5 text-[11px] text-white/70">
          {loading ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-white/50" />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/70" />
          )}
          <span className="truncate font-medium text-white/85">{title || host}</span>
          <span className="hidden truncate text-white/40 sm:inline">· {host}</span>
        </div>

        <ToolbarBtn label="Open in system browser" onClick={openExternal}>
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

      <div className="relative min-h-0 flex-1">
        <webview
          ref={(el: HTMLElement | null) => {
            ref.current = (el as unknown as ElectronWebView) ?? null;
          }}
          src={url}
          partition="persist:reader"
          // @ts-expect-error allowpopups is a valid <webview> attribute but not in React typings
          allowpopups="true"
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#0d0d10",
          }}
        />

        {failure && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d10]/95 backdrop-blur-sm">
            <div className="max-w-md space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6 text-center shadow-xl">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-lg">
                ⚠️
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white/90">
                  {failure.host} refused to load inside PrepOS.
                </div>
                <div className="mt-1 text-[12px] text-white/55">
                  Some sites block embedded framing (error code {failure.code}). You can retry or
                  open it in your system browser.
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={reload}
                  className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/85 hover:bg-white/[0.1]"
                >
                  Try again
                </button>
                <button
                  onClick={openExternal}
                  className="rounded-md border border-emerald-400/30 bg-emerald-400/15 px-3 py-1.5 text-[12px] font-medium text-emerald-200 hover:bg-emerald-400/25"
                >
                  Open in system browser
                </button>
              </div>
            </div>
          </div>
        )}
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
