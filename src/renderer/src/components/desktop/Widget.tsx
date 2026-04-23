import { motion } from "framer-motion";
import clsx from "../../utils/clsx";

interface WidgetProps {
  title: string;
  icon?: React.ReactNode;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  /** Accessible label override; defaults to the widget title. */
  ariaLabel?: string;
}

/**
 * Desktop widget shell — consistent glass card. When `onClick` is provided the
 * card becomes a `role="button"` (with keyboard + a11y + focus ring). We avoid
 * a real `<button>` because widgets embed interactive children (inputs, toggles)
 * and nested `<button>` is invalid HTML.
 *
 * Interactive children should call `e.stopPropagation()` to avoid triggering
 * the card's onClick when, say, a row toggle or input is tapped.
 */
export default function Widget({
  title,
  icon,
  accent,
  action,
  children,
  className,
  onClick,
  delay = 0,
  ariaLabel,
}: WidgetProps) {
  const interactive = Boolean(onClick);

  return (
    <motion.div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? (ariaLabel ?? title) : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.target !== e.currentTarget) return; // don't steal Enter from inputs
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={interactive ? { y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      className={clsx(
        "group pointer-events-auto relative flex min-h-[148px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left backdrop-blur-xl transition-colors focus:outline-none",
        interactive &&
          "cursor-pointer hover:border-white/25 hover:bg-white/[0.07] focus-visible:border-white/35 focus-visible:ring-2 focus-visible:ring-white/25",
        className,
      )}
      style={{
        boxShadow: "0 20px 45px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {accent && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl"
          style={{ background: accent }}
        />
      )}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-white/50">
          {icon && <span className="text-white/70">{icon}</span>}
          {title}
        </div>
        {action && (
          <div className="relative z-[1]" onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </div>
      <div className="relative z-[1] flex flex-1 flex-col">{children}</div>
    </motion.div>
  );
}
