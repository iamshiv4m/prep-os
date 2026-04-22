import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { useShell } from "../store/shell";
import clsx from "../utils/clsx";

const DOCK_SIZE = 52;
const MAX_SIZE = 78;
const SPREAD = 100;

type IconSource = string;

function DockIcon({
  icon,
  label,
  onClick,
  active,
  mouseX,
  accent,
}: {
  icon: IconSource;
  label: string;
  onClick: () => void;
  active?: boolean;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  accent?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });
  const sizeTransform = useTransform(
    distance,
    [-SPREAD, 0, SPREAD],
    [DOCK_SIZE, MAX_SIZE, DOCK_SIZE],
  );
  const size = useSpring(sizeTransform, { mass: 0.1, stiffness: 210, damping: 22 });

  const liftTransform = useTransform(distance, [-SPREAD, 0, SPREAD], [0, -8, 0]);
  const lift = useSpring(liftTransform, { mass: 0.1, stiffness: 210, damping: 22 });

  const isImg = icon.startsWith("http") || icon.startsWith("data:");

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      aria-label={label}
      style={{ width: size, height: size, y: lift }}
      className="group relative flex items-end justify-center rounded-2xl focus:outline-none"
    >
      <div
        className={clsx(
          "relative flex h-full w-full items-center justify-center rounded-[18px] text-[30px] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-12px_30px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors",
          accent
            ? "bg-gradient-to-b from-white/25 to-white/[0.06] ring-1 ring-white/15"
            : "bg-white/[0.08] ring-1 ring-white/10 group-hover:bg-white/[0.14]",
        )}
      >
        {isImg ? (
          <img src={icon} alt={label} className="h-[72%] w-[72%] rounded-[14px] object-cover" />
        ) : (
          <span className="leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]">{icon}</span>
        )}
        <span
          className="pointer-events-none absolute inset-x-3 top-[3px] h-[8px] rounded-full bg-white/30 opacity-60 blur-[3px]"
          aria-hidden
        />
      </div>
      <span
        className={clsx(
          "pointer-events-none absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-all duration-150",
          active ? "w-1.5 bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]" : "bg-transparent",
        )}
      />
      <div className="pointer-events-none absolute -top-10 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <span className="relative whitespace-nowrap rounded-md border border-white/10 bg-neutral-900/90 px-2 py-1 text-[11px] font-medium text-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {label}
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-neutral-900/90" />
        </span>
      </div>
    </motion.button>
  );
}

export default function Dock() {
  const plugins = usePlugins((s) => s.plugins);
  const windows = useWindows((s) => s.windows);
  const openApp = useWindows((s) => s.openApp);
  const focusWindow = useWindows((s) => s.focusWindow);
  const restoreWindow = useWindows((s) => s.restoreWindow);
  const toggleLaunchpad = useShell((s) => s.toggleLaunchpad);

  const mouseX = useMotionValue(Infinity);

  const pinned = plugins.filter((p) => p.builtIn && !p.hidden && p.id !== "settings").slice(0, 10);
  const userPinned = plugins.filter((p) => !p.builtIn && !p.hidden);
  const displayed = [...pinned, ...userPinned];
  const minimized = windows.filter((w) => w.minimized);

  const handleOpen = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (!plugin) return;
    const existing = windows.find((w) => w.pluginId === pluginId);
    if (existing) {
      if (existing.minimized) restoreWindow(existing.id);
      else focusWindow(existing.id);
    } else {
      openApp(plugin);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[9000] flex justify-center">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -bottom-6 h-16 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),transparent_70%)] blur-xl"
        />
        <motion.div
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="pointer-events-auto relative flex items-end gap-1.5 rounded-[22px] border border-white/15 bg-white/[0.09] px-2.5 pb-2 pt-3 shadow-[0_30px_60px_-18px_rgba(0,0,0,0.85),0_10px_20px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl"
        >
          <DockIcon icon="🚀" label="Launchpad" onClick={toggleLaunchpad} mouseX={mouseX} accent />
          <div className="mx-1 h-10 w-px self-center bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          {displayed.map((p) => {
            const active = windows.some((w) => w.pluginId === p.id && !w.minimized);
            return (
              <DockIcon
                key={p.id}
                icon={p.icon}
                label={p.name}
                onClick={() => handleOpen(p.id)}
                active={active}
                mouseX={mouseX}
              />
            );
          })}
          <AnimatePresence>
            {minimized.length > 0 && (
              <motion.div
                key="min-divider"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 1 }}
                exit={{ opacity: 0, width: 0 }}
                className="mx-1 h-10 self-center bg-gradient-to-b from-transparent via-white/20 to-transparent"
              />
            )}
            {minimized.map((w) => {
              const isImg = w.icon.startsWith("http") || w.icon.startsWith("data:");
              return (
                <motion.button
                  key={w.id}
                  initial={{ scale: 0.3, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.3, opacity: 0, y: 30 }}
                  transition={{ type: "spring", stiffness: 360, damping: 26 }}
                  onClick={() => restoreWindow(w.id)}
                  className="group relative flex h-[52px] w-[52px] items-end justify-center"
                  title={`Restore ${w.title}`}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-[18px] bg-white/[0.08] text-[28px] leading-none ring-1 ring-white/10 transition-colors hover:bg-white/[0.16]">
                    {isImg ? (
                      <img
                        src={w.icon}
                        alt={w.title}
                        className="h-[72%] w-[72%] rounded-[14px] object-cover opacity-85"
                      />
                    ) : (
                      <span className="opacity-90">{w.icon}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-1.5 left-1/2 h-1 w-1.5 -translate-x-1/2 rounded-full bg-white/50" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
