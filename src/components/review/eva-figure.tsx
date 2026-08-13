"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * The crew figure — a suit, not a stick, and it knows you are there.
 *
 * Two things were wrong with the old one. It was drawn as single strokes with
 * a circle for a head, which at any size above a favicon read as a stick
 * figure. And it faced permanently forward regardless of anything, which is
 * what made it decoration rather than company.
 *
 * **The suit.** Limbs are now closed outlines with volume rather than lines,
 * and the parts a real EMU has are the parts that are drawn: bubble helmet
 * with a visor, neck ring, hard upper torso, the chest-mounted display and
 * control module, the life-support pack behind the shoulders, bellows at every
 * joint that actually flexes, gloves, boots. Still flat line art — the
 * identity is the 1975 Graphics Standards Manual and a shaded render would be
 * a different product — but a technical illustration of a suit instead of a
 * pictogram of a person.
 *
 * **The posture is the real one.** Arms floating out and forward, knees bent,
 * slight forward curl. That is the neutral body posture the human body adopts
 * in microgravity when no muscle is holding it anywhere — NASA designs
 * workstations around it. It also happens to read as relaxed rather than
 * standing to attention, which is the difference between a mascot and someone
 * keeping you company.
 *
 * **It looks at you.** The helmet, and to a much smaller degree the torso,
 * turn toward the pointer. Presence is attention before it is anything else.
 *
 * It does speak, in `components/companion`, and an earlier version of this
 * comment argued at length that it should not. That was overruled, correctly:
 * the objection was to *flattery*, not to speech, and those are separable. It
 * says only things that are true — real published figures and the real state
 * of the search, including when that state is silence. "Nothing has come back
 * yet, I am not going to dress that up" is company. "You've got this" is not.
 *
 * Tracking is driven through motion values off the render path, so following
 * the cursor costs no React renders, and it is disabled entirely under
 * reduced motion.
 */
/**
 * How the figure is feeling, which is only ever about something real.
 *
 * `alert` fires on a genuine flagged item, `held` while you are actually
 * dragging it, `sleepy` after real inactivity. None of these are randomised —
 * a mood that changes for no reason is a mood you learn to ignore.
 */
export type Mood = "calm" | "curious" | "sleepy" | "held" | "alert";

export function EvaFigure({
  className,
  /** Static for dense UI; alive wherever it has room to be seen. */
  animate = false,
  /** Turn toward the pointer. On by default wherever the figure animates. */
  watch = true,
  mood = "calm",
}: {
  className?: string;
  animate?: boolean;
  watch?: boolean;
  mood?: Mood;
}) {
  const reduced = useReducedMotion();
  const moving = animate && !reduced;
  const tracking = moving && watch;

  const ref = React.useRef<SVGSVGElement>(null);

  // Raw pointer offset, normalised to roughly -1..1 around the figure.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  // Sprung so the head settles rather than snapping — a head that tracks a
  // cursor exactly reads as a security camera, not a person.
  const spring = { stiffness: 110, damping: 18, mass: 0.6 };
  const lookX = useSpring(rawX, spring);
  const lookY = useSpring(rawY, spring);

  // Hoisted, and unconditional. These were originally called inline in the
  // `style` props behind a ternary, which is a conditional hook call — it
  // happens to work while `tracking` never changes and breaks the moment it
  // does. The head turns further than the body: a figure that rotates as one
  // piece reads as a weather vane, where a head leading a slight lean reads
  // as a person.
  const headX = useTransform(lookX, (v) => v * 7);
  const headY = useTransform(lookY, (v) => v * 4.5);
  const bodyX = useTransform(lookX, (v) => v * 2.5);
  const bodyY = useTransform(lookY, (v) => v * 1.5);

  React.useEffect(() => {
    if (!tracking) return;

    // The figure's centre, cached. `getBoundingClientRect` forces layout, and
    // this component renders in six places — reading it inside the pointermove
    // handler meant six synchronous layout reads for every mouse movement.
    // The position only actually changes on scroll or resize, so it is
    // measured there instead and the move handler does arithmetic only.
    let cx = 0;
    let cy = 0;
    let known = false;

    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      known = true;
    };

    const onMove = (e: PointerEvent) => {
      if (!known) measure();
      if (!known) return;
      // Divided by a generous radius so the figure attends to the whole
      // window rather than only to a cursor sitting on top of it.
      const nx = (e.clientX - cx) / Math.max(window.innerWidth / 2, 1);
      const ny = (e.clientY - cy) / Math.max(window.innerHeight / 2, 1);
      rawX.set(Math.max(-1, Math.min(1, nx)));
      rawY.set(Math.max(-1, Math.min(1, ny)));
    };

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [tracking, rawX, rawY]);

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 120 170"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      // Drift and rotation against the tether, on long uneven periods so the
      // loop never becomes a recognisable beat.
      animate={
        moving
          ? mood === "held"
            // Being carried: pulled in and steady, not drifting. A figure that
            // keeps floating while you hold it feels like it is not being held.
            ? { y: 0, rotate: 0, scale: 0.94 }
            : mood === "sleepy"
              // Smaller, slower drift. Nothing droops — this is weightlessness,
              // there is nothing for a tired body to sag against.
              ? { y: [0, -3, 1, 0], rotate: [-1, 0.6, -0.4, -1], scale: 1 }
              : { y: [0, -7, 2, 0], rotate: [-2, 1.5, -0.8, -2], scale: 1 }
          : undefined
      }
      transition={
        moving
          ? mood === "held"
            ? { type: "spring", stiffness: 300, damping: 22 }
            : {
                duration: mood === "sleepy" ? 19 : mood === "curious" ? 9 : 12,
                repeat: Infinity,
                ease: "easeInOut",
              }
          : undefined
      }
      style={{ originX: 0.5, originY: 0.55 }}
    >
      {/* Life-support pack, behind the shoulders and drawn first so it reads
          as being behind them. */}
      <rect x="34" y="56" width="52" height="46" rx="7" strokeOpacity={0.4} />

      {/* Torso: the hard upper torso, wider at the shoulders as the real one is. */}
      <motion.g
        style={tracking ? { x: bodyX, y: bodyY } : undefined}
      >
        <path d="M38 62 Q38 57 44 57 L76 57 Q82 57 82 62 L84 98 Q84 105 77 105 L43 105 Q36 105 36 98 Z" />

        {/* Display and control module — the chest panel every EMU carries. */}
        <rect x="48" y="70" width="24" height="17" rx="2.5" strokeOpacity={0.6} />
        {/* Three indicators. They blink on their own long periods, like status
            lights rather than a loading spinner. */}
        {[54, 60, 66].map((cx, i) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy={78}
            r={1.7}
            strokeOpacity={0.75}
            animate={moving ? { strokeOpacity: [0.2, 0.9, 0.2] } : undefined}
            transition={
              moving
                ? {
                    duration:
                      (mood === "alert" ? 1.1 : mood === "sleepy" ? 7 : 4) + i * 1.7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.9,
                  }
                : undefined
            }
          />
        ))}
        {/* Waist bellows */}
        <path d="M42 96h36M43 100h34" strokeOpacity={0.35} />
      </motion.g>

      {/* Head assembly — the part that actually turns. */}
      <motion.g
        style={tracking ? { x: headX, y: headY } : undefined}
      >
        {/* Neck ring */}
        <rect x="50" y="50" width="20" height="8" rx="4" strokeOpacity={0.6} />
        {/* Bubble helmet */}
        <circle cx="60" cy="30" r="25" />
        {/* Visor — a shape, not a shine. Sits low and wide like a sun visor
            pulled down, which is also what stops the helmet reading as a face. */}
        <motion.path
          d="M43 24 Q60 14 77 24 Q77 42 60 44 Q43 42 43 24 Z"
          animate={{ strokeOpacity: mood === "sleepy" ? 0.22 : 0.55 }}
          transition={{ duration: 1.4 }}
        />
        {/* Helmet light, top-left, as mounted on the real assembly. */}
        <path d="M40 14 l-6 -4" strokeOpacity={0.5} />
      </motion.g>

      {/* Arms. Outlined limbs with joints, floating out and forward — the
          neutral microgravity posture rather than arms at the sides. */}
      <motion.g
        animate={moving ? { rotate: [-3.5, 2.5, -1, -3.5] } : undefined}
        transition={moving ? { duration: 9, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ originX: "38px", originY: "68px" }}
      >
        <Limb ax={38} ay={68} bx={20} by={84} width={13} />
        <Limb ax={20} ay={84} bx={14} by={102} width={11} />
        <circle cx="13" cy="106" r="6.5" />
        <Bellows x={20} y={84} />
      </motion.g>

      <motion.g
        animate={moving ? { rotate: [3, -3.5, 1, 3] } : undefined}
        transition={moving ? { duration: 13, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ originX: "82px", originY: "68px" }}
      >
        <Limb ax={82} ay={68} bx={100} by={84} width={13} />
        <Limb ax={100} ay={84} bx={106} by={102} width={11} />
        <circle cx="107" cy="106" r="6.5" />
        <Bellows x={100} y={84} />
      </motion.g>

      {/* Legs, knees bent, on their own timing so nothing moves in lockstep. */}
      <motion.g
        animate={moving ? { rotate: [1.8, -2.5, 0.8, 1.8] } : undefined}
        transition={moving ? { duration: 15, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ originX: "60px", originY: "104px" }}
      >
        <Limb ax={48} ay={104} bx={40} by={132} width={15} />
        <Limb ax={40} ay={132} bx={48} by={152} width={13} />
        <rect x="38" y="150" width="19" height="10" rx="4" />
        <Bellows x={40} y={132} />

        <Limb ax={72} ay={104} bx={80} by={132} width={15} />
        <Limb ax={80} ay={132} bx={72} by={152} width={13} />
        <rect x="63" y="150" width="19" height="10" rx="4" />
        <Bellows x={80} y={132} />
      </motion.g>

      {/* Tether anchor, pulsing like a status light rather than decoration. */}
      <motion.circle
        cx="60"
        cy="103"
        r="3"
        animate={moving ? { strokeOpacity: [0.3, 0.9, 0.3] } : undefined}
        transition={moving ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" } : undefined}
        strokeOpacity={0.6}
      />
    </motion.svg>
  );
}

/**
 * One limb segment, as a capsule between two points.
 *
 * Drawn as a rounded rect rotated onto the A-B axis rather than a stroked
 * line, which is the entire difference between a suit and a stick figure: a
 * limb with an outline has volume, a stroke does not.
 */
function Limb({
  ax,
  ay,
  bx,
  by,
  width,
}: {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  width: number;
}) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  // The rect extends along +y from the origin, so the rotation is the segment
  // angle less the 90 degrees that +y already carries.
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
  return (
    <rect
      x={-width / 2}
      y={0}
      width={width}
      height={length}
      rx={width / 2}
      transform={`translate(${ax} ${ay}) rotate(${deg})`}
    />
  );
}

/** The convolute rings at a joint — two short arcs, barely there. */
function Bellows({ x, y }: { x: number; y: number }) {
  return (
    <g strokeOpacity={0.35}>
      <path d={`M${x - 5} ${y - 2} h10`} />
      <path d={`M${x - 5} ${y + 2} h10`} />
    </g>
  );
}
