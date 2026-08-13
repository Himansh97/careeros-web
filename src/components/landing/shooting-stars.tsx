"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Occasional meteors.
 *
 * Real ones are rare, brief and unevenly spaced — a sporadic rate is a handful
 * an hour, and even during a shower they arrive in clumps rather than on a
 * beat. So these are scheduled on a random interval between roughly three and
 * nine seconds rather than looping, and no two share a length, angle or speed.
 * A metronome of identical streaks is the version that reads as a screensaver.
 *
 * Randomness is generated only after mount, never during render, for the same
 * reason the star fields use a seeded generator: values that differ between
 * the server and client render are a hydration mismatch. Here the list simply
 * starts empty, which is also correct — the sky has no meteor in it most of
 * the time.
 *
 * Nothing at all under reduced motion. A fast streak crossing the viewport is
 * exactly the kind of sudden peripheral movement that setting exists to stop.
 */
interface Meteor {
  id: number;
  top: number;
  left: number;
  length: number;
  angle: number;
  duration: number;
}

export function ShootingStars() {
  const reduced = useReducedMotion();
  const [meteors, setMeteors] = React.useState<Meteor[]>([]);

  React.useEffect(() => {
    if (reduced) return;
    let timer: number;

    const spawn = () => {
      // Never spawn into a tab nobody is looking at. Browsers coalesce timers
      // in background tabs, so without this a minimised window accumulates
      // queued spawns and dumps them all at once on return.
      if (!document.hidden) {
        const m: Meteor = {
          id: Date.now() + Math.random(),
          // Upper half only. Meteors that begin below the horizon look wrong
          // even to people who could not tell you why.
          top: Math.random() * 46,
          left: 8 + Math.random() * 72,
          length: 90 + Math.random() * 190,
          angle: 24 + Math.random() * 22,
          duration: 0.55 + Math.random() * 0.7,
        };
        // Refuse when full rather than evicting. The first version dropped the
        // oldest to keep the array at four, but an evicted meteor is still
        // mid-flight, so AnimatePresence held it in the DOM through its exit
        // and orphans piled up — seventeen at once, against a cap of four.
        // Declining to add one is invisible; a meteor is meant to be rare.
        setMeteors((prev) => (prev.length >= 4 ? prev : [...prev, m]));
      }
      timer = window.setTimeout(spawn, 3000 + Math.random() * 6000);
    };

    timer = window.setTimeout(spawn, 1500 + Math.random() * 2500);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {meteors.map((m) => (
          <motion.span
            key={m.id}
            className="absolute h-px origin-left"
            style={{
              top: `${m.top}%`,
              left: `${m.left}%`,
              width: m.length,
              rotate: m.angle,
              // Bright head, fading tail — drawn the way one actually looks,
              // rather than as a uniform line with a glow bolted on.
              background:
                "linear-gradient(to left, rgba(255,255,255,0.95), rgba(255,255,255,0))",
            }}
            initial={{ opacity: 0, scaleX: 0.15, x: -40, y: -18 }}
            animate={{ opacity: [0, 1, 1, 0], scaleX: 1, x: 160, y: 74 }}
            exit={{ opacity: 0 }}
            transition={{ duration: m.duration, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
            onAnimationComplete={() =>
              setMeteors((prev) => prev.filter((x) => x.id !== m.id))
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
