import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Rocket } from "lucide-react";
import { useRef } from "react";
import type { PluginManifest } from "@shared/types";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { useShell } from "../store/shell";
import clsx from "../utils/clsx";
import PluginIcon from "./PluginIcon";

const DOCK_SIZE = 52;
const MAX_SIZE = 72;
const SPREAD = 110;

/**
 * Common magnification slot. Renders a fixed-size tile inside a motion box
 * that scales with mouse distance. Uses `transform: scale` instead of animating
 * width/height so inner SVG glyphs scale crisply with no re-render storm.
 */
function DockSlot({
  label,
  onClick,
  active,
  mouseX,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });
  const scaleT = useTransform(distance, [-SPREAD, 0, SPREAD], [1, MAX_SIZE / DOCK_SIZE, 1]);
  const scale = useSpring(scaleT, { mass: 0.1, stiffness: 220, damping: 24 });
  const liftT = useTransform(distance, [-SPREAD, 0, SPREAD], [0, -6, 0]);
  const lift = useSpring(liftT, { mass: 0.1, stiffness: 220, damping: 24 });

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      aria-label={label}
      style={{ width: DOCK_SIZE, height: DOCK_SIZE, y: lift }}
      className="group relative flex items-end justify-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <motion.div
        style={{ scale, transformOrigin: "bottom center", willChange: "transform" }}
        className="relative"
      >
        {children}
      </motion.div>
      <span
        aria-hidden
        className={clsx(
          "pointer-events-none absolute -bottom-1.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all duration-200",
          active
            ? "w-[6px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.65)]"
            : "w-[3px] bg-white/0",
        )}
      />
      <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <span className="relative whitespace-nowrap rounded-md border border-white/10 bg-neutral-900/95 px-2 py-1 text-[11px] font-medium text-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.55)] backdrop-blur-md">
          {label}
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/10 bg-neutral-900/95" />
        </span>
      </div>
    </motion.button>
  );
}

function DockDivider() {
  return (
    <div className="mx-1 h-10 w-px self-center bg-gradient-to-b from-transparent via-white/20 to-transparent" />
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
  const settings = plugins.find((p) => p.id === "settings");
  const minimized = windows.filter((w) => w.minimized);

  const handleOpen = (plugin: PluginManifest) => {
    const existing = windows.find((w) => w.pluginId === plugin.id);
    if (existing) {
      if (existing.minimized) restoreWindow(existing.id);
      else focusWindow(existing.id);
    } else {
      openApp(plugin);
    }
  };

  const glyph = Math.round(DOCK_SIZE * 0.52);

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
          <DockSlot label="Launchpad" onClick={toggleLaunchpad} mouseX={mouseX}>
            <div
              className="flex items-center justify-center bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-10px_20px_-10px_rgba(0,0,0,0.45)]"
              style={{
                width: DOCK_SIZE,
                height: DOCK_SIZE,
                borderRadius: Math.round(DOCK_SIZE * 0.235),
              }}
            >
              <Rocket size={glyph} strokeWidth={2.2} />
            </div>
          </DockSlot>
          <DockDivider />
          {displayed.map((p) => {
            const active = windows.some((w) => w.pluginId === p.id && !w.minimized);
            return (
              <DockSlot
                key={p.id}
                label={p.name}
                onClick={() => handleOpen(p)}
                active={active}
                mouseX={mouseX}
              >
                <PluginIcon plugin={p} size={DOCK_SIZE} />
              </DockSlot>
            );
          })}
          {settings && (
            <>
              <DockDivider />
              <DockSlot
                label={settings.name}
                onClick={() => handleOpen(settings)}
                active={windows.some((w) => w.pluginId === settings.id && !w.minimized)}
                mouseX={mouseX}
              >
                <PluginIcon plugin={settings} size={DOCK_SIZE} />
              </DockSlot>
            </>
          )}
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
              const plugin = plugins.find((p) => p.id === w.pluginId);
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
                  <div className="opacity-90 transition-all duration-150 hover:-translate-y-0.5 hover:opacity-100">
                    <PluginIcon
                      plugin={plugin}
                      fallbackIcon={w.icon}
                      size={DOCK_SIZE}
                      alt={w.title}
                    />
                  </div>
                  <span className="absolute -bottom-1.5 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/55" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
