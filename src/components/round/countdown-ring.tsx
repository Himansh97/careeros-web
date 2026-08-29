"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/primitives";

/**
 * A ring that drains while you think, and the number inside it.
 *
 * Hand-drawn SVG rather than a library, like every other visual in this app.
 * The arc is a single circle with a dash offset animated through
 * `stroke-dashoffset`, which the browser composites rather than re-laying out.
 *
 * **The timer is never load-bearing.** Under `prefers-reduced-motion` the ring
 * does not run at all and no answer is refused for being late — forcing a
 * countdown on someone who asked for less motion is a hostile reading of the
 * request. The clock exists to make this feel like a round rather than a form,
 * and nothing depends on it, which is why turning it off costs nothing.
 */
export function CountdownRing({
  seconds,
  running,
  onElapsed,
  size = 44,
}: {
  seconds: number;
  running: boolean;
  onElapsed?: () => void;
  size?: number;
}) {
  const motionSafe = useMotionSafe();
  // Seeded once, never synced from the prop. React Compiler is on and treats
  // `setState` inside an effect as an error, and syncing state from a prop is
  // the shape it is warning about — the caller remounts this with a `key` when
  // the item changes, which resets the clock without an effect at all.
  const [left, setLeft] = React.useState(seconds);
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (!running || !motionSafe) return;
    const id = window.setInterval(() => {
      setLeft((value) => (value <= 0 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, motionSafe]);

  React.useEffect(() => {
    if (left === 0 && running && motionSafe && !fired.current) {
      fired.current = true;
      onElapsed?.();
    }
  }, [left, running, motionSafe, onElapsed]);

  if (!motionSafe) {
    // No clock, and no empty circle implying one. Reduced motion gets an
    // untimed round rather than a broken-looking timed one.
    return null;
  }

  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = Math.max(0, Math.min(1, left / seconds));
  const low = left <= 10;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${left} seconds left`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - remaining)}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            low ? "stroke-warning" : "stroke-primary",
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-mono text-xs tabular-nums",
          low ? "text-warning" : "text-muted-foreground",
        )}
      >
        {left}
      </span>
    </div>
  );
}
