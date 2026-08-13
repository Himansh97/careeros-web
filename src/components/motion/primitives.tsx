"use client";

import * as React from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
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

/**
 * A number that counts up the first time it scrolls into view.
 *
 * This replaced an `AnimatedNumber` that only moved when a value *changed*, and
 * so did nothing at all on first paint. On pages whose entire content is
 * readings, that left the largest type on the screen as the most inert thing on
 * it — every figure arrived already at rest, so nothing drew the eye to the
 * figure rather than the label.
 *
 * It still handles the change case, which is why the old one is gone rather
 * than sitting alongside: `animate` starts from wherever the value currently
 * is, so a metric that moves after an autopilot run counts from its previous
 * reading to the new one.
 *
 * Counting up is legitimate here for a reason worth stating, because this
 * codebase refuses decoration: the motion is *about the number*. It draws
 * attention to the quantity, it lands on exactly the real value, and it never
 * implies a trend the data does not support — a count from zero is not a claim
 * about last week, it is an entrance. Zero counts to zero and simply sits
 * there, which is correct: nothing should make "0 interviews" look eventful.
 *
 * The value is driven through a MotionValue rendered as a child, so the DOM
 * text updates without a React render per frame.
 *
 * **It starts at the true value, not at zero.** That ordering is not fussiness.
 * Starting at zero means the rendered markup says `0` until JavaScript runs and
 * an observer fires, so any failure along that path — hydration error, a
 * container the observer never reports on, scripting off — leaves a confident
 * `0 applications submitted` on screen when the answer is 11. In a product
 * whose entire claim is that its numbers can be trusted, a *wrong* number is
 * far worse than an un-animated one. So the truth is what renders, and the
 * reset to zero happens in a layout effect, before paint, only once we know
 * motion is wanted. Nobody ever sees the zero unless the count is about to run.
 */
export function CountUp({
  value,
  className,
  /** Fires once, when this much of the element has been seen. */
  amount = 0.6,
}: {
  value: number;
  className?: string;
  amount?: number;
}) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount });

  const count = useMotionValue(value);
  const text = useTransform(count, (v) => Math.round(v).toLocaleString());
  // Whether this instance has already counted. Without it, a value arriving
  // from a query after the element is on screen would rewind to zero and count
  // again, which would read as the figure having changed when it had not.
  const counted = React.useRef(false);

  React.useLayoutEffect(() => {
    // Before the first paint, and only when the count is actually going to
    // run. Reduced motion never rewinds, so it simply keeps the real figure.
    if (reduced || counted.current) return;
    count.set(0);
  }, [reduced, count]);

  React.useEffect(() => {
    if (reduced) {
      count.set(value);
      return;
    }
    if (!inView) return;
    counted.current = true;
    // Duration does not scale with magnitude. 11 and 11,000 take the same
    // time, because the animation is an entrance and not a measure of size —
    // a big number that takes visibly longer reads as slower software.
    const controls = animate(count, value, {
      duration: 0.9,
      ease: [0.22, 0.61, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, value, reduced, count]);

  return (
    <span ref={ref} className={className}>
      {/* The ticking text is hidden from assistive tech — announcing every
          intermediate frame would be unusable — and the real figure is exposed
          once, beside it. */}
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">{value.toLocaleString()}</span>
    </span>
  );
}
