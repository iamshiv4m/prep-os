import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "../utils/clsx";

export interface MenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  type?: "item" | "separator" | "heading";
}

interface Props {
  label: React.ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  minWidth?: number;
  /** Tailwind classes for trigger button. Defaults to menubar-style chip. */
  triggerClassName?: string;
  /** Show a downward caret inside the trigger. */
  showCaret?: boolean;
  /** Controlled open state (optional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function MenuDropdown({
  label,
  items,
  align = "start",
  minWidth = 220,
  triggerClassName,
  showCaret = false,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const rootRef = useRef<HTMLDivElement | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={rootRef} className="no-drag relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          triggerClassName ??
            "flex items-center gap-1 rounded px-2 py-0.5 text-[12px] text-white/85 hover:bg-white/10",
          open && "bg-white/10 text-white",
        )}
      >
        <span className="flex items-center gap-1.5">{label}</span>
        {showCaret && (
          <svg width="8" height="8" viewBox="0 0 8 8" className="opacity-60" aria-hidden>
            <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ minWidth }}
            className={clsx(
              "absolute top-full z-[9600] mt-1 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/95 p-1 shadow-[0_22px_48px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl",
              align === "end" ? "right-0" : "left-0",
            )}
            role="menu"
          >
            {items.map((item, idx) => {
              if (item.type === "separator") {
                return <div key={item.id ?? `sep-${idx}`} className="my-1 h-px bg-white/10" />;
              }
              if (item.type === "heading") {
                return (
                  <div
                    key={item.id}
                    className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55"
                  >
                    {item.label}
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onSelect?.();
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between gap-4 rounded-md px-3 py-1.5 text-left text-[12.5px]",
                    item.disabled
                      ? "cursor-not-allowed text-white/30"
                      : item.danger
                        ? "text-red-300 hover:bg-red-500/15 hover:text-red-200"
                        : "text-white/85 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {item.icon && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[13px] text-white/65">
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.shortcut && (
                    <span className="shrink-0 text-[11px] text-white/45">{item.shortcut}</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
