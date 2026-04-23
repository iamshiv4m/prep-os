import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: Props) {
  const [version, setVersion] = useState<string>("0.1.0");

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const v = await window.prepOS.getVersion();
        setVersion(v);
      } catch {
        /* ignore */
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[9800] flex items-center justify-center bg-black/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.94, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900/92 relative w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/15 p-6 text-center text-white shadow-[0_30px_80px_-18px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-amber-400/25 via-rose-500/25 to-indigo-500/25 text-4xl ring-1 ring-white/15">
              ◆
            </div>
            <div className="text-[18px] font-semibold tracking-tight">PrepOS</div>
            <div className="mt-0.5 text-[11px] text-white/45">Version {version}</div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-white/70">
              Your personal prep operating system. Capture problems, focus on what matters, chat
              with AI, and stay current with curated dev news — all in one place.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-white/50">
              <span>Made for developers &amp; interview prep</span>
            </div>
            <button
              onClick={onClose}
              className="mt-5 rounded-md border border-white/15 bg-white/[0.06] px-5 py-1.5 text-[12px] font-medium text-white/90 hover:bg-white/[0.12]"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
