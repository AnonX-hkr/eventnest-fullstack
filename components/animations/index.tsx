"use client";

/**
 * Reusable Framer Motion animation primitives.
 *
 * Usage:
 *   import { FadeIn, ScaleIn, StaggeredList, staggerChild, ShakeError } from "@/components/animations";
 *
 *   <StaggeredList>
 *     <motion.div variants={staggerChild}>…</motion.div>
 *   </StaggeredList>
 */

import { motion, Variants, MotionProps } from "framer-motion";
import { ReactNode } from "react";

// ─── Easing presets ──────────────────────────────────────────────────────────

const ease = {
  smooth:  [0.25, 0.46, 0.45, 0.94] as const,
  spring:  [0.34, 1.56, 0.64, 1.00] as const,
  snappy:  [0.16, 1.00, 0.3,  1.00] as const,
};

// ─── FadeIn ──────────────────────────────────────────────────────────────────

type Direction = "up" | "down" | "left" | "right" | "none";

const dirOffset: Record<Direction, { x?: number; y?: number }> = {
  up:    { y: 22 },
  down:  { y: -22 },
  left:  { x: 22 },
  right: { x: -22 },
  none:  {},
};

interface FadeInProps extends MotionProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.45,
  className,
  ...rest
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...dirOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: ease.smooth }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ─── ScaleIn ─────────────────────────────────────────────────────────────────

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  from?: number;
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.4,
  from = 0.9,
  className,
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: from }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: ease.spring }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggeredList ───────────────────────────────────────────────────────────

interface StaggeredListProps {
  children: ReactNode;
  stagger?: number;
  delayChildren?: number;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
}

export function StaggeredList({
  children,
  stagger = 0.09,
  delayChildren = 0,
  className,
  as = "div",
}: StaggeredListProps) {
  const Tag = motion[as];
  return (
    <Tag
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren } },
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Apply this as `variants={staggerChild}` on direct children of StaggeredList.
 */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ease: [0.25, 0.46, 0.45, 0.94], duration: 0.4 },
  },
};

/** Scale variant for card children */
export const staggerCardChild: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ease: [0.25, 0.46, 0.45, 0.94], duration: 0.45 },
  },
};

// ─── ShakeError ──────────────────────────────────────────────────────────────

interface ShakeErrorProps {
  children: ReactNode;
  /** Increment this value to trigger a shake (use a counter, not a boolean) */
  shake: number;
  className?: string;
}

export function ShakeError({ children, shake, className }: ShakeErrorProps) {
  return (
    <motion.div
      key={shake}         // re-mount = re-play animation
      animate={shake > 0
        ? { x: [0, -9, 9, -6, 6, -3, 3, 0] }
        : { x: 0 }
      }
      transition={{ duration: 0.42, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideReveal ─────────────────────────────────────────────────────────────

interface SlideRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.48,
  className,
}: SlideRevealProps) {
  const from = {
    up:    { y: "105%", opacity: 0 },
    down:  { y: "-105%", opacity: 0 },
    left:  { x: "105%", opacity: 0 },
    right: { x: "-105%", opacity: 0 },
  }[direction];

  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        initial={from}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration, delay, ease: ease.snappy }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── PressButton ─────────────────────────────────────────────────────────────
// Drop-in replacement for <button> that scales on press

interface PressButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  scale?: number;
}

export function PressButton({ children, scale = 0.97, className, ...rest }: PressButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={className}
      {...(rest as MotionProps)}
    >
      {children}
    </motion.button>
  );
}
