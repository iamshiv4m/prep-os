import { AnimatePresence, motion } from "framer-motion";
import type { SnapZone } from "../store/windows";
import { snapRect } from "../utils/snapZone";

interface Props {
  zone: SnapZone | null;
}

/**
 * Full-screen ghost overlay that previews where a dragged window will snap.
 * Geometry matches `snapWindow` in the store (below menubar, above dock).
 */
export default function SnapPreview({ zone }: Props) {
  if (!zone) return null;

  const rect = snapRect(zone);
  if (!rect) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={zone}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.12 }}
        className="pointer-events-none fixed z-[8800] rounded-xl border-2 border-sky-300/60 bg-sky-400/10 shadow-[0_0_40px_-5px_rgba(56,189,248,0.6)] backdrop-blur-[2px]"
        style={{
          left: rect.x,
          top: rect.y + 28,
          width: rect.width,
          height: rect.height,
        }}
      />
    </AnimatePresence>
  );
}
