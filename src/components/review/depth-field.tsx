"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useContainerScroll } from "@/lib/hooks/use-container-scroll";

/**
 * Depth behind the review, composed rather than rendered.
 *
 * Three planes moving at different rates. That parallax is what reads as
 * three-dimensional in a flat drawing, and it is the reason this needed no 3D
 * renderer: the sense of depth comes from relative motion, which CSS transforms
 * do perfectly well and for no bundle cost.
 *
 * There are stars, and there was an argument about that. The first version
 * refused them as a cliché and shipped instrumentation only — a grid, a
 * horizon, range ticks — which was disciplined and read as an admin panel with
 * a line on it. The cliché is not stars; it is *lazy* stars: one size, one
 * opacity, evenly scattered, drifting as a single plane.
 *
 * These are built the way a real field looks. Three depths at different rates,
 * sizes and brightness correlated with depth, positions from a seeded generator
 * so they cluster unevenly the way real ones do, and only the nearest layer
 * twinkles. The instrumentation stays on top of them, because the horizon and
 * the range scale are what make this a flight display rather than a screensaver.
 *
 * Everything is behind the content at very low contrast, and it disappears
 * entirely under reduced motion. A background that competes with the readings
 * would be decoration, which is what this whole design pass was against.
 */
/**
 * Positions from a seeded generator rather than Math.random.
 *
 * Two reasons. Random positions differ between server and client render, which
 * React reports as a hydration mismatch. And a real star field is not uniform —
 * a deterministic sequence with uneven spacing looks more like the sky than an
 * even scatter does.
 */
function field(count: number, seed: number) {
  const out: { x: number; y: number }[] = [];
  let s = seed;
  for (let i = 0; i < count; i += 1) {
    s = (s * 16807) % 2147483647;
    const x = (s / 2147483647) * 100;
    s = (s * 16807) % 2147483647;
    const y = (s / 2147483647) * 100;
    out.push({ x, y });
  }
  return out;
}

const STARS = {
  far: field(60, 12345),
  mid: field(28, 98765),
  near: field(12, 55555),
};

/**
 * Light rays, dark theme only.
 *
 * They are shafts from a source off the top-right corner — a sun outside the
 * frame, which is how it actually looks from orbit and why the angles here are
 * near-parallel rather than fanning from a visible point. A fan gives away that
 * the source is a few hundred pixels away; parallel shafts read as something
 * very far off.
 *
 * Restricted to dark because there is nothing to restrict on paper. The light
 * palette is a printed document — the identity is a 1975 manual — and volumetric
 * light on white stock reads as a smudge, not as atmosphere. `dark:` handles it
 * in CSS rather than by reading the theme in JS, so there is no hydration
 * window where the rays flash on a light background.
 *
 * Widths and angles are uneven on purpose. Four evenly-spaced identical beams
 * is the version that looks like a stock asset.
 */
const RAYS = [
  { x: "48%", width: 220, angle: 14, opacity: 0.22, delay: 0 },
  { x: "63%", width: 110, angle: 17, opacity: 0.15, delay: 3.5 },
  { x: "74%", width: 300, angle: 12, opacity: 0.26, delay: 1.5 },
  { x: "89%", width: 140, angle: 19, opacity: 0.13, delay: 5 },
];

export function DepthField() {
  const reduced = useReducedMotion();
  const scrollYProgress = useContainerScroll();
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
  // Stars drift more slowly than the instrumentation in front of them, which
  // is what puts them behind it.
  const starsFar = useTransform(progress, [0, 1], ["0%", "-4%"]);
  const starsMid = useTransform(progress, [0, 1], ["0%", "-12%"]);
  const starsNear = useTransform(progress, [0, 1], ["0%", "-26%"]);

  // Reduced motion gets nothing at all rather than a static version: the whole
  // point of these layers is the relative movement, so without it they are
  // clutter behind text.
  if (reduced) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Light rays. Behind the stars, so the stars read as being in front of
          the light rather than floating on top of it. */}
      <motion.div className="absolute inset-0 hidden overflow-hidden dark:block" style={{ y: starsFar }}>
        {RAYS.map((r) => (
          <motion.div
            key={r.x}
            className="absolute -top-1/3 h-[170%] origin-top"
            style={{
              left: r.x,
              width: r.width,
              rotate: r.angle,
              // Fades out along its length rather than ending, which is what
              // stops a shaft of light looking like a rectangle.
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0) 72%)",
              filter: "blur(38px)",
              opacity: r.opacity,
            }}
            // Breathing, not pulsing. Long uneven periods so no two rays are
            // ever at the same brightness and the loop never becomes a beat.
            animate={{ opacity: [r.opacity, r.opacity * 1.5, r.opacity] }}
            transition={{
              duration: 14 + r.delay,
              repeat: Infinity,
              ease: "easeInOut",
              delay: r.delay,
            }}
          />
        ))}
      </motion.div>

      {/* Three star depths. Size and brightness track depth, so the nearest
          layer is the one you notice moving. */}
      <motion.div className="absolute inset-0" style={{ y: starsFar }}>
        {STARS.far.map((s, i) => (
          <span
            key={`f${i}`}
            className="absolute rounded-full bg-foreground"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: 1, height: 1, opacity: 0.18 }}
          />
        ))}
      </motion.div>
      <motion.div className="absolute inset-0" style={{ y: starsMid }}>
        {STARS.mid.map((s, i) => (
          <span
            key={`m${i}`}
            className="absolute rounded-full bg-foreground"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: 1.5, height: 1.5, opacity: 0.3 }}
          />
        ))}
      </motion.div>
      <motion.div className="absolute inset-0" style={{ y: starsNear }}>
        {STARS.near.map((s, i) => (
          <motion.span
            key={`n${i}`}
            className="absolute rounded-full bg-foreground"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: 2, height: 2 }}
            animate={{ opacity: [0.5, 0.15, 0.5] }}
            transition={{
              duration: 3 + (i % 5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </motion.div>
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
