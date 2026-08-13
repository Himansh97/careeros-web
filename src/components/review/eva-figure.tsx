"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The crew figure — drawn as a technical illustration, and alive.
 *
 * The first version was a static SVG rendered at 32 pixels inside a panel
 * header. It was correct and completely invisible, which is a good reminder
 * that "restrained" and "not there" are different things.
 *
 * It floats now. A body on a tether in microgravity is never still: it drifts,
 * rotates slightly against the tether, and the free limbs lag behind the torso.
 * Those three motions are what make a drawing read as a person rather than an
 * icon, and each is cheap — transforms only, no layout, so it stays at 60fps.
 *
 * Still a flat line drawing. The identity is the 1975 Graphics Standards
 * Manual, and a shaded, rendered astronaut would be a different product. What
 * changed is scale and life, not register.
 */
export function EvaFigure({
  className,
  /** Static for dense UI; alive wherever it has room to be seen. */
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  const reduced = useReducedMotion();
  const moving = animate && !reduced;

  return (
    <motion.svg
      viewBox="0 0 64 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      // The whole body drifts and rotates against the tether. Long, uneven
      // durations so the loop never becomes a recognisable beat.
      animate={
        moving
          ? { y: [0, -8, 2, 0], rotate: [-2.5, 1.5, -1, -2.5] }
          : undefined
      }
      transition={
        moving
          ? { duration: 11, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      style={{ originX: 0.5, originY: 0.55 }}
    >
      {/* Life-support pack */}
      <rect x="20" y="26" width="24" height="26" rx="3" />
      <path d="M24 32h16M24 38h16" strokeOpacity={0.45} />

      {/* Helmet, visor as a shape rather than a shine */}
      <circle cx="32" cy="16" r="11" />
      <path d="M25 13a7 7 0 0 1 14 0v3a7 7 0 0 1-14 0z" strokeOpacity={0.55} />
      <path d="M27 26h10" />

      {/* Arms lag behind the torso — the detail that sells weightlessness. */}
      <motion.g
        animate={moving ? { rotate: [-4, 3, -1, -4] } : undefined}
        transition={moving ? { duration: 9, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ originX: "20px", originY: "30px" }}
      >
        <path d="M20 30 8 22M8 22l-3-5" />
      </motion.g>
      <motion.g
        animate={moving ? { rotate: [3, -4, 1, 3] } : undefined}
        transition={moving ? { duration: 13, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ originX: "44px", originY: "32px" }}
      >
        <path d="M44 32l11 9M55 41l5 2" />
      </motion.g>

      {/* Legs, drifting on their own timing so nothing moves in lockstep. */}
      <motion.g
        animate={moving ? { rotate: [2, -3, 1, 2] } : undefined}
        transition={moving ? { duration: 15, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ originX: "32px", originY: "52px" }}
      >
        <path d="M25 52l-3 18M22 70l-4 8" />
        <path d="M39 52l3 18M42 70l4 8" />
      </motion.g>

      {/* Tether anchor, pulsing like a status light rather than decoration. */}
      <motion.circle
        cx="32"
        cy="52"
        r="2"
        animate={moving ? { strokeOpacity: [0.3, 0.9, 0.3] } : undefined}
        transition={moving ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" } : undefined}
        strokeOpacity={0.6}
      />
    </motion.svg>
  );
}
