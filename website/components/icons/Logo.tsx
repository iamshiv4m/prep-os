import type { SVGProps } from "react";

/**
 * The PrepOS brand mark.
 *
 * A squircle-style indigo→violet gradient tile with a custom geometric "P"
 * glyph, a soft top-half "glass" highlight, and a hairline inner border. The
 * glyph is drawn as a path (not a font letter) so it stays crisp and on-brand
 * at every size — from a 14px nav avatar to a 256px app icon.
 *
 * The IDs in the gradient defs are suffixed with `instanceId` so multiple
 * Logos on the same page don't collide (a real Safari/Firefox gotcha when
 * two SVGs share gradient IDs).
 */
export default function Logo({
  instanceId = "prepos-logo",
  ...props
}: SVGProps<SVGSVGElement> & { instanceId?: string }) {
  const bg = `${instanceId}-bg`;
  const shine = `${instanceId}-shine`;
  const glyph = `${instanceId}-glyph`;
  const inner = `${instanceId}-inner`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C5CFF" />
          <stop offset="55%" stopColor="#6447F0" />
          <stop offset="100%" stopColor="#4F32D8" />
        </linearGradient>

        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.32" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={glyph} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0.92" />
        </linearGradient>

        <radialGradient id={inner} cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="40" height="40" rx="11" fill={`url(#${bg})`} />

      <rect width="40" height="40" rx="11" fill={`url(#${inner})`} />

      <rect width="40" height="20" rx="11" fill={`url(#${shine})`} />

      <rect
        x="0.6"
        y="0.6"
        width="38.8"
        height="38.8"
        rx="10.4"
        fill="none"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="1"
      />

      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={`url(#${glyph})`}
        d="M12 10.5 H21.5 C25.366 10.5 28.5 13.634 28.5 17.5 C28.5 21.366 25.366 24.5 21.5 24.5 H16.5 V29.5 H12 V10.5 Z M16.5 14.5 V20.5 H21.5 C23.1569 20.5 24.5 19.1569 24.5 17.5 C24.5 15.8431 23.1569 14.5 21.5 14.5 H16.5 Z"
      />
    </svg>
  );
}
