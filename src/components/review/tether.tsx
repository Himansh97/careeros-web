"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { EvaFigure } from "@/components/review/eva-figure";

/**
 * The tether, which is the scroll indicator.
 *
 * The figure's position along it maps to scroll progress, so it reports where
 * you are in the review rather than drifting for effect. That distinction is
 * the whole reason this is here: an astronaut that floats decoratively is a
 * mascot, and one that marks your position is an instrument.
 *
 * Depth is composed rather than simulated — the line, the figure and the tick
 * marks move at different rates, which is what reads as three-dimensional in a
 * flat drawing. No 3D renderer is involved and none is needed for this register.
 *
 * Under reduced motion the figure sits at the top and stays there. The review
 * is a document; losing the travel loses nothing.
 */
export function Tether({ sections }: { sections: string[] }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // Springing the raw progress stops the figure jittering on trackpad scroll,
  // which on a thin line is very visible.
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  // Travel stops a little short of the ends so the figure never clips the
  // viewport edges at either extreme.
  const top = useTransform(progress, [0, 1], ["4%", "88%"]);
  const drift = useTransform(progress, [0, 0.5, 1], [-3, 3, -3]);
  const lineScale = useTransform(progress, [0, 1], [0.04, 1]);

  return (
    <div
      // Was `hidden lg:block`, which meant the figure this whole feature is
      // about did not exist at all on a narrower window — and a scroll
      // indicator that vanishes exactly when the screen is small enough to
      // need one is the wrong way round. It narrows instead of disappearing.
      className="pointer-events-none fixed inset-y-0 left-1 z-10 w-10 sm:left-6 sm:w-16"
      aria-hidden="true"
    >
      {/* The unwalked line, faint. */}
      <div className="absolute inset-y-8 left-4 w-px bg-foreground/12 sm:left-8" />

      {/* The walked line, drawn to current progress — this is the actual
          read: how much of the review is behind you. */}
      <motion.div
        className="absolute inset-y-8 left-4 w-px origin-top bg-primary/50 sm:left-8"
        style={reduced ? { scaleY: 1 } : { scaleY: lineScale }}
      />

      {/* Section ticks, evenly spaced. Structure that encodes something true —
          there really are five stops. */}
      {sections.map((label, i) => (
        <div
          key={label}
          className="absolute left-4 flex items-center gap-2 sm:left-8"
          style={{ top: `${8 + (i * 80) / Math.max(sections.length - 1, 1)}%` }}
        >
          <span className="block h-px w-2 bg-foreground/25" />
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60 lg:block">
            {label}
          </span>
        </div>
      ))}

      <motion.div
        className="absolute left-0 w-10 text-primary sm:w-16"
        style={
          reduced
            ? { top: "4%" }
            : { top, x: drift }
        }
      >
        <EvaFigure className="h-10 w-full sm:h-14" />
      </motion.div>
    </div>
  );
}
