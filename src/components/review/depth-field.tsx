"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * Depth behind the review, composed rather than rendered.
 *
 * Three planes moving at different rates. That parallax is what reads as
 * three-dimensional in a flat drawing, and it is the reason this needed no 3D
 * renderer: the sense of depth comes from relative motion, which CSS transforms
 * do perfectly well and for no bundle cost.
 *
 * Deliberately not a starfield. Every product that reaches for "space" reaches
 * for scattered dots, and it would fight the printed-manual identity this app
 * committed to. What moves here instead is instrumentation — a horizon line, a
 * measurement grid, a range scale — which is the vernacular of a flight display
 * and encodes the one true thing about this page: you are travelling through it.
 *
 * Everything is behind the content at very low contrast, and it disappears
 * entirely under reduced motion. A background that competes with the readings
 * would be decoration, which is what this whole design pass was against.
 */
export function DepthField() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 26,
    restDelta: 0.001,
  });

  // Three rates. The nearest plane moves most, which is what sells the depth.
  const far = useTransform(progress, [0, 1], ["0%", "-8%"]);
  const mid = useTransform(progress, [0, 1], ["0%", "-22%"]);
  const near = useTransform(progress, [0, 1], ["0%", "-45%"]);
  const horizonY = useTransform(progress, [0, 1], ["62%", "24%"]);
  const fade = useTransform(progress, [0, 0.08, 0.9, 1], [0, 1, 1, 0.2]);

  // Reduced motion gets nothing at all rather than a static version: the whole
  // point of these layers is the relative movement, so without it they are
  // clutter behind text.
  if (reduced) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Far plane — a measurement grid, barely there. */}
      <motion.div
        className="absolute inset-x-0 -top-[10%] h-[140%] opacity-[0.05]"
        style={{
          y: far,
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* The horizon. It rises as you descend the page, which is what a real
          attitude indicator does and what makes the travel feel like travel. */}
      <motion.div
        className="absolute inset-x-0 h-px bg-primary/25"
        style={{ top: horizonY, opacity: fade }}
      />
      <motion.div
        className="absolute inset-x-0 h-24 bg-gradient-to-b from-primary/[0.04] to-transparent"
        style={{ top: horizonY, opacity: fade }}
      />

      {/* Mid plane — range ticks along the left, like a scale you are passing. */}
      <motion.div className="absolute inset-y-0 left-0 w-full" style={{ y: mid, opacity: fade }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 h-px bg-foreground/[0.07]"
            style={{ top: `${i * 9}%`, width: i % 3 === 0 ? "5rem" : "2rem" }}
          />
        ))}
      </motion.div>

      {/* Near plane — a few registration marks, the fastest movers. */}
      <motion.div className="absolute inset-0" style={{ y: near, opacity: fade }}>
        {[18, 44, 71, 88].map((top, i) => (
          <div
            key={top}
            className="absolute right-[6%] size-1.5 border border-foreground/10"
            style={{ top: `${top}%`, transform: `rotate(${i * 45}deg)` }}
          />
        ))}
      </motion.div>
    </div>
  );
}
