"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useContainerScroll } from "@/lib/hooks/use-container-scroll";

/**
 * The three star planes the bodies sit inside.
 *
 * Separate from the review's DepthField, which carries flight instrumentation
 * — a horizon, a range scale, registration marks — that belongs on a readout
 * and would be noise on a landing page. This is only depth.
 *
 * Positions come from a seeded generator rather than Math.random for two
 * reasons: random differs between server and client render, which React
 * reports as a hydration mismatch; and a real field is not uniform, so a
 * deterministic sequence with uneven spacing looks more like the sky than an
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

const PLANES = [
  { stars: field(90, 24680), size: 1, opacity: 0.2, depth: 3 },
  { stars: field(44, 13579), size: 1.6, opacity: 0.32, depth: 9 },
  { stars: field(16, 86420), size: 2.2, opacity: 0.5, depth: 20 },
];

export function StarLayers() {
  const reduced = useReducedMotion();
  const raw = useContainerScroll();
  const progress = useSpring(raw, { stiffness: 70, damping: 26, restDelta: 0.001 });

  const y0 = useTransform(progress, [0, 1], ["0%", `-${PLANES[0].depth}%`]);
  const y1 = useTransform(progress, [0, 1], ["0%", `-${PLANES[1].depth}%`]);
  const y2 = useTransform(progress, [0, 1], ["0%", `-${PLANES[2].depth}%`]);
  const ys = [y0, y1, y2];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PLANES.map((plane, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={reduced ? undefined : { y: ys[i] }}
        >
          {plane.stars.map((s, j) => (
            <span
              key={j}
              className="absolute rounded-full bg-foreground"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: plane.size,
                height: plane.size,
                opacity: plane.opacity,
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
