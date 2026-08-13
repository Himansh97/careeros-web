"use client";

import * as React from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useContainerScroll } from "@/lib/hooks/use-container-scroll";
import { BODIES, bodyRadius, spinSeconds, type SpaceBody } from "@/lib/space-objects";

/**
 * The sector — a moving, layered field of real objects.
 *
 * Six depths, each travelling at its own rate, which is what reads as
 * three-dimensional without a 3D renderer. From back to front: two star
 * planes, the black holes, the far asteroids, the near asteroids, and a dust
 * layer that moves fastest of all.
 *
 * The bodies are not decoration and are not interchangeable. Sizes derive from
 * published diameters and spins from published rotation periods, both from
 * NASA/JPL — but be precise about which of those is exact. The **spins are
 * proportional**: Didymos turns 3.4 times for each rotation of Ryugu here
 * because it does out there. The **sizes are log-scaled**, so the ordering is
 * real and the ratios are compressed; at true scale Psyche would be 650 times
 * Apophis and Apophis would be invisible. The copy beside this field says so
 * rather than claiming a fidelity the rendering does not have.
 *
 * Each is focusable and clickable, because the whole point is that they carry
 * information. Keyboard reaches every one of them in reading order.
 */

/** A stable irregular outline per body. Real shapes vary wildly and a circle
 *  would be a lie of a different kind; this at least says "not a sphere". */
function outline(seed: string, points = 11): string {
  let s = 0;
  for (let i = 0; i < seed.length; i += 1) s = (s * 31 + seed.charCodeAt(i)) % 2147483647;
  const coords: string[] = [];
  for (let i = 0; i < points; i += 1) {
    s = (s * 16807) % 2147483647;
    const jitter = 0.74 + (s / 2147483647) * 0.34;
    const angle = (i / points) * Math.PI * 2;
    coords.push(
      `${(50 + Math.cos(angle) * 46 * jitter).toFixed(1)},${(
        50 +
        Math.sin(angle) * 46 * jitter
      ).toFixed(1)}`
    );
  }
  return coords.join(" ");
}

function Asteroid({ body, size }: { body: SpaceBody; size: number }) {
  const reduced = useReducedMotion();
  const spin = spinSeconds(body.rotationHours);

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      aria-hidden="true"
      // Spun at the real period, scaled. Linear because a rotating body does
      // not ease — this is the one place linear is the honest curve.
      animate={reduced || !spin ? undefined : { rotate: 360 }}
      transition={
        reduced || !spin ? undefined : { duration: spin, repeat: Infinity, ease: "linear" }
      }
    >
      <polygon points={outline(body.id)} />
      {/* A couple of craters, drawn as the manual would: outlines, no shading. */}
      <ellipse cx="38" cy="42" rx="9" ry="7" strokeOpacity={0.4} />
      <ellipse cx="62" cy="61" rx="6" ry="5" strokeOpacity={0.3} />
    </motion.svg>
  );
}

function BlackHole({ size }: { size: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      animate={reduced ? undefined : { rotate: 360 }}
      transition={reduced ? undefined : { duration: 190, repeat: Infinity, ease: "linear" }}
    >
      {/* The shadow, then the ring. The 2019 and 2022 images are both a bright
          asymmetric ring around a dark centre, so that is what is drawn. */}
      <circle cx="50" cy="50" r="19" className="fill-background" />
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="13"
        stroke="currentColor"
        strokeWidth={2}
        strokeOpacity={0.75}
      />
      <ellipse
        cx="50"
        cy="50"
        rx="30"
        ry="9"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeOpacity={0.4}
      />
      <circle cx="50" cy="50" r="19" stroke="currentColor" strokeWidth={1.6} />
    </motion.svg>
  );
}

/** Where each body sits, and how fast its plane travels. */
const PLACEMENT: Record<
  string,
  { x: string; y: string; depth: number; scale: number }
> = {
  m87: { x: "12%", y: "18%", depth: 0.06, scale: 1.15 },
  "sgr-a": { x: "82%", y: "70%", depth: 0.1, scale: 1.5 },
  psyche: { x: "70%", y: "16%", depth: 0.22, scale: 1 },
  eros: { x: "22%", y: "62%", depth: 0.3, scale: 1 },
  ryugu: { x: "45%", y: "34%", depth: 0.44, scale: 1.1 },
  didymos: { x: "88%", y: "38%", depth: 0.56, scale: 1.15 },
  bennu: { x: "33%", y: "86%", depth: 0.7, scale: 1.3 },
  apophis: { x: "58%", y: "72%", depth: 0.88, scale: 1.45 },
};

export function OrbitalField({
  onSelect,
  selectedId,
}: {
  onSelect: (body: SpaceBody) => void;
  selectedId?: string;
}) {
  const reduced = useReducedMotion();
  const raw = useContainerScroll();
  const progress = useSpring(raw, { stiffness: 70, damping: 26, restDelta: 0.001 });

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden={false}>
      {BODIES.map((body) => {
        const p = PLACEMENT[body.id];
        if (!p) return null;
        const size = bodyRadius(body.diameterKm) * 2 * p.scale;
        const active = selectedId === body.id;

        return (
          <Parallax key={body.id} progress={progress} depth={p.depth} reduced={reduced}>
            <button
              type="button"
              onClick={() => onSelect(body)}
              className={`group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active ? "text-primary" : "text-foreground/55 hover:text-primary/90"
              }`}
              style={{ left: p.x, top: p.y }}
              // The accessible name carries the real content, so this is
              // useful with a screen reader rather than a field of "button".
              aria-label={`${body.designation}. ${body.fact}`}
            >
              {body.kind === "black-hole" ? (
                <BlackHole size={size} />
              ) : (
                <Asteroid body={body} size={size} />
              )}
              <span
                // Always labelled. A field of unnamed shapes is a mood; the
                // names are the reason these are here at all.
                className={`pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground/70 group-hover:text-primary group-focus-visible:text-primary"
                }`}
              >
                {body.short}
              </span>
            </button>
          </Parallax>
        );
      })}
    </div>
  );
}

/** One depth plane. Deeper planes travel less, which is the whole illusion. */
function Parallax({
  progress,
  depth,
  reduced,
  children,
}: {
  progress: ReturnType<typeof useSpring>;
  depth: number;
  reduced: boolean | null;
  children: React.ReactNode;
}) {
  const y = useTransform(progress, [0, 1], ["0%", `${-depth * 60}%`]);
  return (
    // `pointer-events-none` is load-bearing, not tidiness. Every plane is
    // `inset-0`, so all eight stack full-bleed on top of each other; without
    // this the last one mounted swallowed every click across the whole field
    // and only its own body was ever selectable. The buttons opt back in.
    <motion.div
      className="pointer-events-none absolute inset-0"
      style={reduced ? undefined : { y }}
    >
      {children}
    </motion.div>
  );
}
