import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWindows, type WindowState } from "../store/windows";
import clsx from "../utils/clsx";

interface WindowProps {
  win: WindowState;
  children: React.ReactNode;
}

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface DragState {
  mode: "move" | "resize";
  edge?: ResizeEdge;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

export default function Window({ win, children }: WindowProps) {
  const focusedId = useWindows((s) => s.focusedId);
  const focus = useWindows((s) => s.focusWindow);
  const close = useWindows((s) => s.closeWindow);
  const minimize = useWindows((s) => s.minimizeWindow);
  const toggleMax = useWindows((s) => s.toggleMaximize);
  const move = useWindows((s) => s.moveWindow);
  const resize = useWindows((s) => s.resizeWindow);

  const focused = focusedId === win.id;
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback(
    (mode: "move" | "resize", edge?: ResizeEdge) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (win.maximized && mode === "move") return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      focus(win.id);
      dragRef.current = {
        mode,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
        origW: win.width,
        origH: win.height,
      };
      setIsDragging(true);
    },
    [focus, win.id, win.x, win.y, win.width, win.height, win.maximized],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (d.mode === "move") {
        move(win.id, Math.max(0, d.origX + dx), Math.max(28, d.origY + dy));
      } else if (d.mode === "resize" && d.edge) {
        let nx = d.origX;
        let ny = d.origY;
        let nw = d.origW;
        let nh = d.origH;
        if (d.edge.includes("e")) nw = d.origW + dx;
        if (d.edge.includes("s")) nh = d.origH + dy;
        if (d.edge.includes("w")) {
          nw = d.origW - dx;
          nx = d.origX + dx;
        }
        if (d.edge.includes("n")) {
          nh = d.origH - dy;
          ny = d.origY + dy;
        }
        nw = Math.max(360, nw);
        nh = Math.max(260, nh);
        move(win.id, nx, ny);
        resize(win.id, nw, nh);
      }
    };
    const handleUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, move, resize, win.id]);

  return (
    <AnimatePresence>
      {!win.minimized && (
        <motion.div
          key={win.id}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className={clsx(
            "absolute flex flex-col overflow-hidden rounded-[10px] border backdrop-blur-2xl",
            focused
              ? "border-white/20 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.7)] ring-1 ring-black/40"
              : "border-white/10 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]",
          )}
          style={{
            left: win.x,
            top: win.y,
            width: win.width,
            height: win.height,
            zIndex: win.zIndex,
            backgroundColor: focused ? "rgba(22,22,26,0.82)" : "rgba(20,20,24,0.72)",
          }}
          onMouseDown={() => focus(win.id)}
        >
          <div
            className="relative flex h-7 shrink-0 items-center gap-2 bg-black/20 px-3"
            onPointerDown={onPointerDown("move")}
            onDoubleClick={() =>
              toggleMax(win.id, {
                width: window.innerWidth,
                height: window.innerHeight,
              })
            }
          >
            <div className="flex items-center gap-2">
              <button
                aria-label="Close"
                className="traffic-light no-drag bg-[#ff5f57] hover:bg-[#ff5f57]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => close(win.id)}
              />
              <button
                aria-label="Minimize"
                className="traffic-light no-drag bg-[#febc2e] hover:bg-[#febc2e]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => minimize(win.id)}
              />
              <button
                aria-label="Zoom"
                className="traffic-light no-drag bg-[#28c840] hover:bg-[#28c840]"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() =>
                  toggleMax(win.id, {
                    width: window.innerWidth,
                    height: window.innerHeight,
                  })
                }
              />
            </div>
            <div className="pointer-events-none flex flex-1 items-center justify-center gap-1.5 pr-[54px] text-[11px] font-medium text-white/35">
              <span className="leading-none">{win.icon}</span>
              <span className="tracking-tight">{win.title}</span>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>

          {!win.maximized && (
            <>
              <div
                onPointerDown={onPointerDown("resize", "n")}
                className="absolute left-2 right-2 top-0 h-1 cursor-ns-resize"
              />
              <div
                onPointerDown={onPointerDown("resize", "s")}
                className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize"
              />
              <div
                onPointerDown={onPointerDown("resize", "e")}
                className="absolute bottom-2 right-0 top-2 w-1 cursor-ew-resize"
              />
              <div
                onPointerDown={onPointerDown("resize", "w")}
                className="absolute bottom-2 left-0 top-2 w-1 cursor-ew-resize"
              />
              <div
                onPointerDown={onPointerDown("resize", "se")}
                className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize"
              />
              <div
                onPointerDown={onPointerDown("resize", "sw")}
                className="absolute bottom-0 left-0 h-3 w-3 cursor-nesw-resize"
              />
              <div
                onPointerDown={onPointerDown("resize", "ne")}
                className="absolute right-0 top-0 h-3 w-3 cursor-nesw-resize"
              />
              <div
                onPointerDown={onPointerDown("resize", "nw")}
                className="absolute left-0 top-0 h-3 w-3 cursor-nwse-resize"
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
