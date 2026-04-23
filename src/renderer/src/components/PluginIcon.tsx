import type { PluginManifest } from "@shared/types";
import clsx from "../utils/clsx";
import { APP_TILES } from "../constants/appTiles";

interface Props {
  plugin?: Pick<PluginManifest, "id" | "icon" | "name"> | null;
  /** Overall tile size in px. The glyph inside scales to ~52% of this. */
  size: number;
  /** Corner radius. Defaults to 22% of size (matches iOS continuous curves). */
  radius?: number;
  /** Extra classes on the outermost tile. */
  className?: string;
  /** Raw emoji string — used when `plugin` is not available (e.g. minimized window with unknown plugin). */
  fallbackIcon?: string;
  /** Name for alt text. */
  alt?: string;
  /** Subtle highlight for focus/active states. */
  ring?: boolean;
}

function isImageIcon(icon: string | undefined): boolean {
  if (!icon) return false;
  return icon.startsWith("http") || icon.startsWith("data:");
}

export default function PluginIcon({
  plugin,
  size,
  radius,
  className,
  fallbackIcon,
  alt,
  ring,
}: Props) {
  const borderRadius = radius ?? Math.round(size * 0.235);
  const tile = plugin ? APP_TILES[plugin.id] : undefined;
  const icon = plugin?.icon ?? fallbackIcon ?? "🌐";
  const label = alt ?? plugin?.name ?? "App";

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius,
  };

  const glossStyle: React.CSSProperties = {
    position: "absolute",
    inset: `${Math.round(size * 0.05)}px ${Math.round(size * 0.14)}px auto ${Math.round(size * 0.14)}px`,
    height: `${Math.round(size * 0.18)}px`,
    borderRadius: `${Math.round(size * 0.12)}px`,
    background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)",
    pointerEvents: "none",
    filter: "blur(2px)",
    opacity: 0.7,
  };

  const shadowInset =
    "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -10px 24px -10px rgba(0,0,0,0.45)";

  if (tile) {
    const glyphSize = Math.round(size * 0.52);
    return (
      <div
        role="img"
        aria-label={label}
        style={{ ...baseStyle, boxShadow: shadowInset }}
        className={clsx(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
          tile.gradient,
          ring && "ring-1 ring-white/25",
          className,
        )}
      >
        <tile.Icon
          size={glyphSize}
          strokeWidth={tile.stroke ?? 2}
          className="relative z-[1] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        />
        <span aria-hidden style={glossStyle} />
      </div>
    );
  }

  if (isImageIcon(icon)) {
    return (
      <div
        role="img"
        aria-label={label}
        style={{ ...baseStyle, boxShadow: shadowInset }}
        className={clsx(
          "relative flex items-center justify-center overflow-hidden bg-white/[0.08] ring-1 ring-white/10",
          ring && "ring-white/25",
          className,
        )}
      >
        <img
          src={icon}
          alt={label}
          className="h-[74%] w-[74%] object-contain"
          style={{ borderRadius: Math.round(borderRadius * 0.5) }}
        />
        <span aria-hidden style={glossStyle} />
      </div>
    );
  }

  // Emoji fallback — dark gradient tile so every user-added app still looks like a native tile.
  const emojiSize = Math.round(size * 0.56);
  return (
    <div
      role="img"
      aria-label={label}
      style={{ ...baseStyle, boxShadow: shadowInset }}
      className={clsx(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-700 to-neutral-900 ring-1 ring-white/10",
        ring && "ring-white/25",
        className,
      )}
    >
      <span
        className="relative z-[1] leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
        style={{ fontSize: emojiSize }}
      >
        {icon}
      </span>
      <span aria-hidden style={glossStyle} />
    </div>
  );
}
