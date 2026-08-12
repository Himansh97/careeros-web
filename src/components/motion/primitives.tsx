"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";

/**
 * Motion that carries information, and nothing that doesn't.
 *
 * The test applied throughout: does the animation tell the user something they
 * would otherwise have to work out? Dismissing a job used to make the row
 * vanish, which is indistinguishable from a render bug — an exit that slides
 * away says "that went somewhere because you did that". Re-sorting used to
 * teleport rows, so the reason the order changed was invisible; animating the
 * positions makes it legible. A card that merely pulses on load tells nobody
 * anything and is not here.
 *
 * **`prefers-reduced-motion` is honoured everywhere.** It is a real
 * accessibility setting — vestibular disorders make large motion genuinely
 * unpleasant — not a nicety. Every primitive collapses to an instant state
 * change when it's set, rather than to a slower version of the same movement.
 */

/** Durations short enough to feel like response, not performance. */
const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };
const FADE: Transition = { duration: 0.18, ease: [0.22, 0.61, 0.36, 1] };

export function useMotionSafe() {
  return !useReducedMotion();
}

interface ListItemProps {
  children: React.ReactNode;
  /** Stable identity — required for exit animations to target the right row. */
  layoutId?: string;
  className?: string;
}

/**
 * A row in a list that can be added, removed, or reordered.
 *
 * `layout` is what makes a re-sort readable: when the jobs list switches from
 * "best fit" to "worth doing next", rows travel to their new positions instead
 * of the whole list snapping, so it is obvious that the same items were
 * reordered rather than replaced.
 */
export function MotionListItem({ children, layoutId, className }: ListItemProps) {
  const animate = useMotionSafe();

  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      layout
      layoutId={layoutId}
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        // Leaves to the side rather than shrinking: dismissing is a decision
        // about that row, and sideways motion reads as "removed" where a
        // collapse reads as "loading".
        x: -12,
        transition: FADE,
      }}
      transition={SPRING}
    >
      {children}
    </motion.div>
  );
}

/** Wrap a list so its children can animate out before unmounting. */
export function MotionList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  );
}

/**
 * A number that counts to its value.
 *
 * Only worth it where the number changing is itself the news — a metric that
 * moves after an autopilot run. It counts in integers and lands exactly on the
 * target, because a metric that reads 7.4 mid-flight is worse than one that
 * simply changes.
 */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const animate = useMotionSafe();
  const [display, setDisplay] = React.useState(value);
  const previous = React.useRef(value);

  React.useEffect(() => {
    if (!animate || previous.current === value) {
      previous.current = value;
      setDisplay(value);
      return;
    }
    const from = previous.current;
    previous.current = value;

    const steps = Math.min(Math.abs(value - from), 18);
    if (steps === 0) {
      setDisplay(value);
      return;
    }
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      if (step >= steps) {
        setDisplay(value);
        clearInterval(id);
        return;
      }
      setDisplay(Math.round(from + ((value - from) * step) / steps));
    }, 26);
    return () => clearInterval(id);
  }, [value, animate]);

  return (
    <span className={className} aria-live="polite">
      {display.toLocaleString()}
    </span>
  );
}

/**
 * Content that replaces a skeleton.
 *
 * A hard swap from skeleton to data makes a fast response look like a glitch.
 * A short fade reads as the content arriving.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FADE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered entry for a group of cards.
 *
 * Capped deliberately: past about six items the stagger stops reading as
 * sequence and starts reading as lag.
 */
export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode[];
  className?: string;
}) {
  const animate = useMotionSafe();
  if (!animate) return <div className={className}>{children}</div>;

  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <FadeIn delay={Math.min(i, 6) * 0.035}>{child}</FadeIn>
      ))}
    </div>
  );
}
