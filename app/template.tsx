"use client";

import { motion } from "framer-motion";

/**
 * template.tsx re-mounts on EVERY route change (unlike layout.tsx which persists).
 * This gives each page its own entrance animation with no shared state carryover.
 *
 * Transition: subtle upward fade + slight scale-up so the new page feels
 * like it's rising into focus rather than just appearing.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.42,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
