"use client";

import { motion } from "framer-motion";

/*
  template.tsx re-mounts on every route change (unlike layout.tsx which persists).
  This gives us true per-page entrance animations.
*/
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
