import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import appIcon from "../assets/app-icon.png";

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

  // Portal the modal to <body> so it escapes the Menubar's containing block.
  // The Menubar root uses `backdrop-blur-2xl`, which (per the CSS spec)
  // creates a containing block for any descendant with `position: fixed`.
  // Without the portal, `inset-0` would resolve to the 28px-tall Menubar
  // instead of the full viewport, pinning the modal to the very top.
  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[9800] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.94, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            // Use an arbitrary hex (not Tailwind's `/92` modifier — `/92` is not
            // on the standard opacity scale, so the class is never generated and
            // the card renders fully transparent on top of the desktop, with
            // hero text bleeding through. `bg-[#0c0c12]` is a guaranteed solid
            // dark surface that matches the rest of the macOS-style chrome.
            className="relative w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/15 bg-[#0c0c12] p-6 text-center text-white shadow-[0_30px_80px_-18px_rgba(0,0,0,0.75)]"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <img
              src={appIcon}
              alt="PrepOS app icon"
              className="mx-auto mb-4 h-20 w-20 rounded-[22px] shadow-[0_10px_30px_-10px_rgba(124,58,237,0.55)] ring-1 ring-white/10"
              draggable={false}
            />
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

  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
