import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import clsx from "../utils/clsx";

export interface CtxMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  type?: "item" | "separator";
  disabled?: boolean;
}

interface Props {
  x: number;
  /** Bottom y-coord where the menu should anchor (it opens upward). */
  y: number;
  items: CtxMenuItem[];
  onClose: () => void;
}

export default function DockContextMenu({ x, y, items, onClose }: Props) {
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      // Close on any mousedown outside — parent passes its own onSelect to close
      const el = e.target as HTMLElement;
      if (!el.closest?.("[data-dock-ctx-menu]")) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        data-dock-ctx-menu
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[9900] min-w-[200px] origin-bottom overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 p-1 text-[12.5px] text-white/90 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        style={{
          left: x,
          top: y,
          transform: "translate(-50%, -100%)",
        }}
      >
        {items.map((it) =>
          it.type === "separator" ? (
            <div key={it.id} className="my-1 h-px bg-white/10" />
          ) : (
            <button
              key={it.id}
              disabled={it.disabled}
              onClick={() => {
                if (it.disabled) return;
                it.onSelect?.();
                onClose();
              }}
              className={clsx(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left",
                !it.disabled && !it.danger && "hover:bg-white/10",
                !it.disabled && it.danger && "text-rose-300 hover:bg-rose-500/15",
                it.disabled && "opacity-40",
              )}
            >
              {it.icon && <span className="shrink-0 text-white/60">{it.icon}</span>}
              <span className="flex-1 truncate">{it.label}</span>
            </button>
          ),
        )}
      </motion.div>
    </AnimatePresence>
  );
}
