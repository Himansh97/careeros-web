"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { EvaFigure, type Mood } from "@/components/review/eva-figure";
import { nextThought, type Context } from "@/lib/companion/thoughts";
import { listAlerts } from "@/lib/api/ops";
import { listApprovals } from "@/lib/api/approvals";
import { listEvidence } from "@/lib/api/evidence";
import { getSkywatch } from "@/lib/api/skywatch";
import { isLiveApi } from "@/lib/api/client";

/**
 * The companion. It follows you, and it stays where you put it.
 *
 * Those sound contradictory and are not — it is how an actual pet behaves. The
 * place you drop it becomes **home**. While you are moving around it trails
 * after the pointer at a lazy distance, keeping out of the way rather than
 * sitting under the cursor. When you go still it wanders back home and settles,
 * and once settled it starts thinking out loud.
 *
 * The laziness lives in the *target*, not the spring. The spring is stiff so
 * dragging feels direct; a slow spring would make it feel like dragging
 * something through syrup. Following is slow because the target is eased
 * toward the pointer a few percent per frame, which is what produces the
 * trailing, unhurried quality rather than a cursor attachment.
 *
 * Drag is implemented on raw pointer events instead of framer's `drag`,
 * because that applies its own transform which would fight the same x/y motion
 * values the follow behaviour drives. One owner for position, no compounding.
 *
 * Thoughts are in `lib/companion/thoughts.ts` and every one of them is true:
 * real published figures, and the real state of the search read from the same
 * endpoints the app reads — including when that state is that nothing has come
 * back yet.
 *
 * Under `prefers-reduced-motion` it does not follow, does not drift and does
 * not think; it simply sits where it was left.
 */
const POS_KEY = "careeros:companion-home";
const SIZE = 64;
/** How far it prefers to stay from the pointer. Underfoot is not endearing. */
const STANDOFF = 104;
/** Pointer still for this long and it heads home. */
const SETTLE_AFTER = 2200;
const IDLE_BEFORE_THINKING = 9_000;
const THOUGHT_VISIBLE = 9_000;
const GAP_BETWEEN_THOUGHTS = 8_000;

interface Pos {
  x: number;
  y: number;
}

function clampToViewport(p: Pos): Pos {
  return {
    x: Math.min(Math.max(p.x, 8), Math.max(window.innerWidth - SIZE - 8, 8)),
    y: Math.min(Math.max(p.y, 8), Math.max(window.innerHeight - SIZE - 8, 8)),
  };
}

function loadHome(): Pos | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pos;
    return typeof p?.x === "number" && typeof p?.y === "number" ? p : null;
  } catch {
    return null;
  }
}

export function Companion() {
  const reduced = useReducedMotion();
  const live = isLiveApi();

  const [dragging, setDragging] = React.useState(false);
  const [thought, setThought] = React.useState<string | null>(null);
  const [register, setRegister] = React.useState("wonder");
  const [idleMs, setIdleMs] = React.useState(0);
  const [side, setSide] = React.useState<"left" | "right">("right");

  // Position is a motion value, so following and dragging never cause a React
  // render — this component would otherwise re-render on every mouse move.
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  // Hidden until placed. A motion value rather than state, because setting
  // state in the placement effect is a cascading render — and this way the
  // first paint has it invisible at the origin rather than visibly jumping
  // from the top-left corner to its corner.
  const opacity = useMotionValue(0);
  const x = useSpring(tx, { stiffness: 260, damping: 30, mass: 0.9 });
  const y = useSpring(ty, { stiffness: 260, damping: 30, mass: 0.9 });

  const home = React.useRef<Pos>({ x: 0, y: 0 });
  const placed = React.useRef(false);
  const pointer = React.useRef<Pos | null>(null);
  const lastMove = React.useRef(0);
  const draggingRef = React.useRef(false);
  const grabOffset = React.useRef<Pos>({ x: 0, y: 0 });
  const recent = React.useRef<string[]>([]);

  // ── initial placement ────────────────────────────────────────────────────
  React.useEffect(() => {
    const start = clampToViewport(
      loadHome() ?? { x: window.innerWidth - 116, y: window.innerHeight - 132 }
    );
    home.current = start;
    tx.set(start.x);
    ty.set(start.y);
    x.jump(start.x);
    y.jump(start.y);
    placed.current = true;
    opacity.set(1);
  }, [tx, ty, x, y, opacity]);

  // ── follow, then wander home ─────────────────────────────────────────────
  React.useEffect(() => {
    if (reduced) return;

    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
      lastMove.current = Date.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let frame = 0;
    const step = () => {
      frame = requestAnimationFrame(step);
      if (draggingRef.current) return;

      const now = Date.now();
      const settled = now - lastMove.current > SETTLE_AFTER;
      const cur = { x: tx.get(), y: ty.get() };

      let goal: Pos;
      if (settled || !pointer.current) {
        goal = home.current;
      } else {
        // Sit off to one side of the pointer rather than on it, on whichever
        // side there is room. A pet that stands on your hands is a nuisance.
        const p = pointer.current;
        const prefer = p.x > window.innerWidth / 2 ? -1 : 1;
        goal = clampToViewport({
          x: p.x + prefer * STANDOFF - SIZE / 2,
          y: p.y + 36,
        });
        // Close enough is close enough — no jitter when already in place.
        if (Math.hypot(goal.x - cur.x, goal.y - cur.y) < 26) return;
      }

      // The laziness. Easing the target rather than softening the spring is
      // what makes this read as trailing after you instead of being tied to
      // the cursor.
      const ease = settled ? 0.035 : 0.06;
      tx.set(cur.x + (goal.x - cur.x) * ease);
      ty.set(cur.y + (goal.y - cur.y) * ease);
    };
    frame = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [reduced, tx, ty]);

  // Which side the speech bubble opens on, so it never runs off an edge.
  React.useEffect(() => {
    const unsub = x.on("change", (v) => setSide(v < 300 ? "left" : "right"));
    return unsub;
  }, [x]);

  // ── drag: raw pointer events, so position has exactly one owner ──────────
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduced) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    // Picking it up interrupts whatever it was thinking about — it is paying
    // attention to you now. Done here rather than in an effect on `dragging`,
    // which would be a cascading render.
    setThought(null);
    grabOffset.current = { x: e.clientX - tx.get(), y: e.clientY - ty.get() };
  };

  const onPointerMoveDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const next = clampToViewport({
      x: e.clientX - grabOffset.current.x,
      y: e.clientY - grabOffset.current.y,
    });
    tx.set(next.x);
    ty.set(next.y);
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    // Where you dropped it is where it now lives.
    const dropped = clampToViewport({ x: tx.get(), y: ty.get() });
    home.current = dropped;
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(dropped));
    } catch {
      // Private browsing: it forgets its spot on reload. Nothing else breaks.
    }
  };

  // Keep home inside the window when the window shrinks.
  React.useEffect(() => {
    const onResize = () => {
      home.current = clampToViewport(home.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── real state, for real thoughts ────────────────────────────────────────
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: listAlerts, enabled: live, retry: false });
  const approvals = useQuery({ queryKey: ["approvals", "companion"], queryFn: listApprovals, enabled: live, retry: false });
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: listEvidence, enabled: live, retry: false });
  const sky = useQuery({ queryKey: ["skywatch"], queryFn: getSkywatch, enabled: live, retry: false, refetchInterval: 30_000 });

  const funnel = alerts.data?.ok ? alerts.data.data.funnel : null;
  const urgent = alerts.data?.ok ? alerts.data.data.high : 0;
  const cleared = approvals.data?.ok
    ? approvals.data.data.filter((a) => a.status === "pending" && a.commit?.verdict !== "nogo").length
    : 0;

  const contextRef = React.useRef<Context>({
    submitted: 0, responded: 0, interviews: 0, cleared: 0, claims: 0,
    urgentAlerts: 0, idleSeconds: 0,
  });
  // Written in an effect, not during render. Mutating a ref while rendering is
  // a real hazard under concurrent rendering, and React Compiler rejects it —
  // the daydream loop reads this asynchronously so an effect is timely enough.
  const nextContext: Context = {
    submitted: funnel?.submitted ?? 0,
    responded: funnel?.responded ?? 0,
    interviews: funnel?.interviews ?? 0,
    cleared,
    claims: evidence.data?.ok ? evidence.data.data.claims.length : 0,
    urgentAlerts: urgent,
    issLatitude: sky.data?.ok ? sky.data.data.iss?.latitude : undefined,
    issAltitudeKm: sky.data?.ok ? sky.data.data.iss?.altitudeKm : undefined,
    issDaylight: sky.data?.ok ? sky.data.data.iss?.daylight : undefined,
    kp: sky.data?.ok ? sky.data.data.geomagnetic?.kp : undefined,
    nextApproach:
      sky.data?.ok && sky.data.data.approaches?.[0]
        ? {
            designation: sky.data.data.approaches[0].designation,
            lunarDistances: sky.data.data.approaches[0].lunarDistances,
          }
        : undefined,
    idleSeconds: Math.round(idleMs / 1000),
  };
  // No dependency array: the object is rebuilt every render by design, so the
  // ref should simply track the latest one. A dep array here would either be
  // a lie or change on every render anyway.
  React.useEffect(() => {
    contextRef.current = nextContext;
  });

  // ── idle clock ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (reduced) return;
    let last = Date.now();
    const wake = () => {
      last = Date.now();
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    const tick = window.setInterval(() => setIdleMs(Date.now() - last), 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, wake));
      window.clearInterval(tick);
    };
  }, [reduced]);

  // ── the daydream ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (reduced) return;
    let timer: number;

    const show = () => {
      // Not while it is being carried, and not into a tab nobody is watching.
      if (document.hidden || draggingRef.current) {
        timer = window.setTimeout(show, GAP_BETWEEN_THOUGHTS);
        return;
      }
      const picked = nextThought(contextRef.current, recent.current);
      if (!picked) {
        timer = window.setTimeout(show, GAP_BETWEEN_THOUGHTS);
        return;
      }
      recent.current = [...recent.current, picked.text].slice(-8);
      setThought(picked.text);
      setRegister(picked.register);
      timer = window.setTimeout(() => {
        setThought(null);
        timer = window.setTimeout(show, GAP_BETWEEN_THOUGHTS);
      }, THOUGHT_VISIBLE);
    };

    timer = window.setTimeout(show, IDLE_BEFORE_THINKING);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const mood: Mood = dragging
    ? "held"
    : urgent > 0
      ? "alert"
      : thought
        ? "curious"
        : idleMs > 120_000
          ? "sleepy"
          : "calm";

  return (
    <motion.div className="fixed left-0 top-0 z-50" style={{ x, y, opacity, touchAction: "none" }}>
      <AnimatePresence>
        {thought && !dragging && (
          <motion.div
            key={thought}
            role="status"
            className={`absolute bottom-full mb-3 w-64 rounded-lg border border-border bg-card p-3 shadow-lg ${
              side === "left" ? "left-0" : "right-0"
            }`}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
              {register === "heart"
                ? "thinking about you"
                : register === "mind"
                  ? "thinking"
                  : "wondering"}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground">{thought}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMoveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => {
          // A drop also fires a click; only open the readout on a real tap.
          if (!draggingRef.current) {
            window.dispatchEvent(new CustomEvent("careeros:capcom-toggle"));
          }
        }}
        aria-label="CareerOS companion — drag to move, click for the current readings"
        className="block cursor-grab touch-none rounded-full p-1 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="grid size-16 place-items-center rounded-full border border-border bg-card/85 text-primary shadow-md backdrop-blur">
          <EvaFigure className="h-12 w-12" animate mood={mood} watch={!dragging} />
        </span>
      </button>
    </motion.div>
  );
}
