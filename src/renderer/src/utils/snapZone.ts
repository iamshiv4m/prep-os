import type { SnapZone } from "../store/windows";

/**
 * Maps a cursor position to the nearest snap zone, or null if none.
 * Edge sensitivity = 16px; corners take precedence over halves.
 */
export function snapZoneForCursor(x: number, y: number): SnapZone | null {
  const EDGE = 16;
  const CORNER = 40;
  if (typeof window === "undefined") return null;
  const w = window.innerWidth;
  const h = window.innerHeight;

  const atLeft = x <= EDGE;
  const atRight = x >= w - EDGE;
  const atTop = y <= EDGE + 4;

  if (x <= CORNER && y <= CORNER + 4) return "top-left";
  if (x >= w - CORNER && y <= CORNER + 4) return "top-right";
  if (x <= CORNER && y >= h - CORNER) return "bottom-left";
  if (x >= w - CORNER && y >= h - CORNER) return "bottom-right";

  if (atTop) return "top";
  if (atLeft) return "left";
  if (atRight) return "right";
  return null;
}

/** Pixel rect for a given snap zone. */
export function snapRect(zone: SnapZone): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  if (typeof window === "undefined") return null;
  const MENUBAR = 28;
  const DOCK_ROOM = 88;
  const usableW = window.innerWidth;
  const usableH = window.innerHeight - MENUBAR - DOCK_ROOM;
  const halfW = Math.round(usableW / 2);
  const halfH = Math.round(usableH / 2);

  switch (zone) {
    case "left":
      return { x: 0, y: 0, width: halfW, height: usableH };
    case "right":
      return { x: halfW, y: 0, width: usableW - halfW, height: usableH };
    case "top":
      return { x: 0, y: 0, width: usableW, height: usableH };
    case "top-left":
      return { x: 0, y: 0, width: halfW, height: halfH };
    case "top-right":
      return { x: halfW, y: 0, width: usableW - halfW, height: halfH };
    case "bottom-left":
      return { x: 0, y: halfH, width: halfW, height: usableH - halfH };
    case "bottom-right":
      return { x: halfW, y: halfH, width: usableW - halfW, height: usableH - halfH };
    default:
      return null;
  }
}
