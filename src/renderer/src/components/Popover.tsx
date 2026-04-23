import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "../utils/clsx";

interface Props {
  trigger: (args: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  width?: number;
  className?: string;
  /**
   * Incrementing signal to open the popover from the outside. Every time this
   * value changes (and is > 0) the popover opens. Useful for widgets that want
   * to trigger a menubar popover without owning its state.
   */
  openSignal?: number;
}

export default function Popover({
  trigger,
  children,
  align = "end",
  width = 320,
  className,
  openSignal,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Respond to external open signals
  useEffect(() => {
    if (openSignal && openSignal > 0) setOpen(true);
  }, [openSignal]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="no-drag relative">
      {trigger({ open, toggle: () => setOpen(!open) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{ width }}
            className={clsx(
              "absolute top-full z-[9600] mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
