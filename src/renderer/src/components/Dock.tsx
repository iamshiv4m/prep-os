import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { EyeOff, LogOut, Pin, PinOff, Rocket, SquareStack, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PluginManifest } from "@shared/types";
import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";
import { useShell } from "../store/shell";
import { useFocus } from "../store/focus";
import { useFeedUnread } from "../hooks/useFeedUnread";
import clsx from "../utils/clsx";
import DockContextMenu, { type CtxMenuItem } from "./DockContextMenu";
import PluginIcon from "./PluginIcon";

const DOCK_SIZE = 52;
const MAX_SIZE = 68;
// Keep the magnification radius smaller than the icon-to-icon distance
// (~58px center-to-center with gap-1.5) so neighbor icons stay calm when
// you're clearly hovering a single tile.
const SPREAD = 50;
// How close to the bottom edge the cursor must be to reveal an auto-hidden dock.
const AUTOHIDE_PEEK_PX = 72;

interface DockSlotProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  focusPulse?: boolean;
  badge?: number;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPointerDownCapture?: (e: React.PointerEvent<HTMLButtonElement>) => void;
}

/**
 * Common magnification slot. Renders a fixed-size tile inside a motion box
 * that scales with mouse distance. Uses `transform: scale` instead of animating
 * width/height so inner SVG glyphs scale crisply with no re-render storm.
 */
function DockSlot({
  label,
  onClick,
  active,
  focusPulse,
  badge,
  mouseX,
  children,
  onContextMenu,
  onPointerDownCapture,
}: DockSlotProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });
  const scaleT = useTransform(distance, [-SPREAD, 0, SPREAD], [1, MAX_SIZE / DOCK_SIZE, 1]);
  const scale = useSpring(scaleT, { mass: 0.08, stiffness: 260, damping: 22 });
  const liftT = useTransform(distance, [-SPREAD, 0, SPREAD], [0, -4, 0]);
  const lift = useSpring(liftT, { mass: 0.08, stiffness: 260, damping: 22 });

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onPointerDownCapture={onPointerDownCapture}
      aria-label={label}
      style={{ width: DOCK_SIZE, height: DOCK_SIZE, y: lift }}
      className="group relative flex items-end justify-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <motion.div
        style={{ scale, transformOrigin: "bottom center", willChange: "transform" }}
        className="relative"
      >
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-[#1a0a15] bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(244,63,94,0.55)]">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {focusPulse && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-1 -top-1 flex h-2.5 w-2.5"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-80" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </span>
        )}
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

interface CtxState {
  plugin: PluginManifest;
  x: number;
  y: number;
}

export default function Dock() {
  const plugins = usePlugins((s) => s.plugins);
  const removePlugin = usePlugins((s) => s.remove);
  const windows = useWindows((s) => s.windows);
  const openApp = useWindows((s) => s.openApp);
  const focusWindow = useWindows((s) => s.focusWindow);
  const restoreWindow = useWindows((s) => s.restoreWindow);
  const closeWindow = useWindows((s) => s.closeWindow);
  const minimizeWindow = useWindows((s) => s.minimizeWindow);
  const toggleLaunchpad = useShell((s) => s.toggleLaunchpad);
  const dockAutoHide = useShell((s) => s.dockAutoHide);
  const setDockAutoHide = useShell((s) => s.setDockAutoHide);
  const customOrder = useShell((s) => s.customDockOrder);
  const setCustomOrder = useShell((s) => s.setCustomDockOrder);
  const focusActive = useFocus((s) => s.active);
  const focusTargetId = useFocus((s) => s.targetPluginId);
  const { count: feedUnread } = useFeedUnread();

  const mouseX = useMotionValue(Infinity);

  // Auto-hide peek detection — only reveal when cursor is near bottom edge.
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    if (!dockAutoHide) {
      setPeek(true);
      return;
    }
    setPeek(false);
    const onMove = (e: PointerEvent) => {
      const near = e.clientY >= window.innerHeight - AUTOHIDE_PEEK_PX;
      setPeek(near);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [dockAutoHide]);

  const pinned = plugins.filter((p) => p.builtIn && !p.hidden && p.id !== "settings").slice(0, 10);
  const userPinned = useMemo(() => {
    const list = plugins.filter((p) => !p.builtIn && !p.hidden);
    if (customOrder.length === 0) return list;
    const byId = new Map(list.map((p) => [p.id, p] as const));
    const ordered: PluginManifest[] = [];
    for (const id of customOrder) {
      const p = byId.get(id);
      if (p) {
        ordered.push(p);
        byId.delete(id);
      }
    }
    // Append any apps added since the order was saved.
    return [...ordered, ...byId.values()];
  }, [plugins, customOrder]);
  const settings = plugins.find((p) => p.id === "settings");
  const minimized = windows.filter((w) => w.minimized);

  const handleOpen = useCallback(
    (plugin: PluginManifest) => {
      const existing = windows.find((w) => w.pluginId === plugin.id);
      if (existing) {
        if (existing.minimized) restoreWindow(existing.id);
        else focusWindow(existing.id);
      } else {
        openApp(plugin);
      }
    },
    [windows, openApp, focusWindow, restoreWindow],
  );

  // Context menu state + builder
  const [ctx, setCtx] = useState<CtxState | null>(null);

  const openCtx = useCallback((plugin: PluginManifest, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCtx({ plugin, x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const ctxItems = useMemo<CtxMenuItem[]>(() => {
    if (!ctx) return [];
    const plug = ctx.plugin;
    const wins = windows.filter((w) => w.pluginId === plug.id);
    const hasWindows = wins.length > 0;
    const items: CtxMenuItem[] = [];
    items.push({
      id: "open",
      label: hasWindows ? "Bring to front" : "Open",
      icon: <Rocket className="h-3.5 w-3.5" />,
      onSelect: () => handleOpen(plug),
    });
    if (wins.length > 1) {
      items.push({
        id: "showall",
        label: `Show all ${wins.length} windows`,
        icon: <SquareStack className="h-3.5 w-3.5" />,
        onSelect: () =>
          wins.forEach((w) => (w.minimized ? restoreWindow(w.id) : focusWindow(w.id))),
      });
    }
    if (hasWindows) {
      items.push({
        id: "hide",
        label: "Hide",
        icon: <EyeOff className="h-3.5 w-3.5" />,
        onSelect: () => wins.forEach((w) => minimizeWindow(w.id)),
      });
      items.push({
        id: "quit",
        label: `Quit ${plug.name}`,
        icon: <LogOut className="h-3.5 w-3.5" />,
        danger: true,
        onSelect: () => wins.forEach((w) => closeWindow(w.id)),
      });
    }
    items.push({ id: "sep1", label: "", type: "separator" });
    items.push({
      id: "autohide",
      label: dockAutoHide ? "Always show dock" : "Auto-hide dock",
      icon: dockAutoHide ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />,
      onSelect: () => setDockAutoHide(!dockAutoHide),
    });
    if (!plug.builtIn) {
      items.push({ id: "sep2", label: "", type: "separator" });
      items.push({
        id: "remove",
        label: `Remove ${plug.name}`,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        danger: true,
        onSelect: () => {
          void removePlugin(plug.id);
          const next = customOrder.filter((id) => id !== plug.id);
          if (next.length !== customOrder.length) setCustomOrder(next);
        },
      });
    }
    return items;
  }, [
    ctx,
    windows,
    handleOpen,
    restoreWindow,
    focusWindow,
    minimizeWindow,
    closeWindow,
    dockAutoHide,
    setDockAutoHide,
    removePlugin,
    customOrder,
    setCustomOrder,
  ]);

  // Drag-to-reorder (only for user-added apps) — simple position-swap model.
  const dragPluginId = useRef<string | null>(null);
  const dragStartX = useRef<number>(0);
  const onReorderPointerDown = (pluginId: string, e: React.PointerEvent<HTMLButtonElement>) => {
    // Only start a reorder gesture on left-click with small slop; this avoids
    // stealing clicks that should just open the app.
    if (e.button !== 0) return;
    dragPluginId.current = pluginId;
    dragStartX.current = e.clientX;
  };
  useEffect(() => {
    const onUp = (e: PointerEvent) => {
      const id = dragPluginId.current;
      dragPluginId.current = null;
      if (!id) return;
      const delta = e.clientX - dragStartX.current;
      if (Math.abs(delta) < 24) return; // treat as plain click
      const list = userPinned.map((p) => p.id);
      const idx = list.indexOf(id);
      if (idx < 0) return;
      const step = delta > 0 ? 1 : -1;
      const targetIdx = Math.max(0, Math.min(list.length - 1, idx + step));
      if (targetIdx === idx) return;
      const next = [...list];
      next.splice(idx, 1);
      next.splice(targetIdx, 0, id);
      setCustomOrder(next);
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [userPinned, setCustomOrder]);

  const glyph = Math.round(DOCK_SIZE * 0.52);

  return (
    <>
      <motion.div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[9000] flex justify-center"
        animate={{
          y: peek ? 0 : 110,
          opacity: peek ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
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
            <DockSlot
              label="Launchpad"
              onClick={toggleLaunchpad}
              mouseX={mouseX}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtx({
                  plugin: {
                    id: "__launchpad__",
                    name: "Launchpad",
                    icon: "🚀",
                    version: "0",
                    type: "native",
                    entry: "launchpad",
                    builtIn: true,
                  } as PluginManifest,
                  x: (e.currentTarget as HTMLElement).getBoundingClientRect().left + DOCK_SIZE / 2,
                  y: (e.currentTarget as HTMLElement).getBoundingClientRect().top,
                });
              }}
            >
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
            {pinned.map((p) => {
              const active = windows.some((w) => w.pluginId === p.id && !w.minimized);
              const badge = p.id === "feed" ? feedUnread : undefined;
              const focusPulse = focusActive && focusTargetId === p.id;
              return (
                <DockSlot
                  key={p.id}
                  label={p.name}
                  onClick={() => handleOpen(p)}
                  active={active}
                  badge={badge}
                  focusPulse={focusPulse}
                  mouseX={mouseX}
                  onContextMenu={(e) => openCtx(p, e)}
                >
                  <PluginIcon plugin={p} size={DOCK_SIZE} />
                </DockSlot>
              );
            })}
            {userPinned.length > 0 && <DockDivider />}
            {userPinned.map((p) => {
              const active = windows.some((w) => w.pluginId === p.id && !w.minimized);
              const focusPulse = focusActive && focusTargetId === p.id;
              return (
                <DockSlot
                  key={p.id}
                  label={p.name}
                  onClick={() => handleOpen(p)}
                  active={active}
                  focusPulse={focusPulse}
                  mouseX={mouseX}
                  onContextMenu={(e) => openCtx(p, e)}
                  onPointerDownCapture={(e) => onReorderPointerDown(p.id, e)}
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
                  onContextMenu={(e) => openCtx(settings, e)}
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
      </motion.div>
      {ctx && <DockContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </>
  );
}
