import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpCircle, Download, X } from "lucide-react";
import type { UpdateAvailablePayload } from "@shared/types";

const DISMISSED_KEY = "prepos.update.dismissedVersion";

/**
 * Lives in the bottom-right of the desktop. The main process fires
 * `update:available` ~10s after boot if a newer GitHub release exists; we
 * render a discreet glass pill that lets the user either jump to the
 * download page or dismiss until the *next* new version ships. Dismissal
 * is keyed on the version string so a later release re-surfaces the banner.
 */
export default function UpdateBanner() {
  const [payload, setPayload] = useState<UpdateAvailablePayload | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const off = window.prepOS.onUpdateAvailable?.((next) => {
      try {
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (dismissed === next.latest) return;
      } catch {
        /* localStorage unavailable — fall through and show anyway */
      }
      setPayload(next);
    });
    return () => {
      if (typeof off === "function") off();
    };
  }, []);

  if (!payload) return null;

  const dismiss = (remember: boolean) => {
    if (remember) {
      try {
        localStorage.setItem(DISMISSED_KEY, payload.latest);
      } catch {
        /* ignore */
      }
    }
    setPayload(null);
    setExpanded(false);
  };

  const openDownload = async () => {
    await window.prepOS.openExternal(payload.url);
    dismiss(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={payload.latest}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="pointer-events-auto fixed bottom-24 right-6 z-[200] max-w-sm"
      >
        <div className="rounded-2xl border border-white/10 bg-black/70 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-indigo-200">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13px] font-semibold text-white">
                  PrepOS {payload.latest} available
                </div>
                <button
                  onClick={() => dismiss(true)}
                  className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white/80"
                  title="Dismiss — I'll remind you on the next release"
                  aria-label="Dismiss update"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-0.5 text-[11px] text-white/50">
                You're on {payload.current}. Updates ship via the website — one click and you're
                done.
              </div>

              {payload.notes && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 text-[11px] text-indigo-300/80 transition hover:text-indigo-200"
                >
                  {expanded ? "Hide" : "What's new?"}
                </button>
              )}
              {expanded && payload.notes && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-white/5 p-2 text-[11px] leading-relaxed text-white/70">
                  {payload.notes}
                </pre>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={openDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-black transition hover:bg-white/90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => dismiss(true)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-white/60 transition hover:bg-white/10 hover:text-white/90"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
