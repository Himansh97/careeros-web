"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { animate as tween, AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { EvaFigure, type Mood } from "@/components/review/eva-figure";
import { nextThought, type Context } from "@/lib/companion/thoughts";
import { listAlerts } from "@/lib/api/ops";
import { listApprovals } from "@/lib/api/approvals";
import { listEvidence } from "@/lib/api/evidence";
import { getSkywatch } from "@/lib/api/skywatch";
import { isLiveApi } from "@/lib/api/client";

/**
 * The companion. It lives where you put it, and every so often it comes over.
 *
 * It used to trail the pointer continuously, which was the wrong instinct —
 * something permanently at your elbow is not company, it is a cursor with a
 * face. Now the place you drop it is **home**, it stays there, and once in a
 * while it launches off to do something daft: kicks over to wherever you are
 * working and hangs about a moment, tumbles end over end, pushes off too hard
 * and gets yanked back by its own tether. Then it drifts home and settles.
 *
 * Rarity is the entire joke. At roughly one antic a minute you look up and
 * catch it mid-somersault; at one every five seconds it is wallpaper. The
 * moves themselves are all things a body actually does in microgravity —
 * nothing here falls, because there is nothing to fall toward.
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
  const [goofy, setGoofy] = React.useState(false);

  // Position is a motion value, so following and dragging never cause a React
  // render — this component would otherwise re-render on every mouse move.
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  // Hidden until placed. A motion value rather than state, because setting
  // state in the placement effect is a cascading render — and this way the
  // first paint has it invisible at the origin rather than visibly jumping
  // from the top-left corner to its corner.
  const opacity = useMotionValue(0);
  /** Tumble angle. Separate from the figure's own idle rotation so the two
   *  compose instead of fighting over the same transform. */
  const spin = useMotionValue(0);
  const x = useSpring(tx, { stiffness: 260, damping: 30, mass: 0.9 });
  const y = useSpring(ty, { stiffness: 260, damping: 30, mass: 0.9 });

  const home = React.useRef<Pos>({ x: 0, y: 0 });
  const placed = React.useRef(false);
  const pointer = React.useRef<Pos | null>(null);
  const draggingRef = React.useRef(false);
  const grabOffset = React.useRef<Pos>({ x: 0, y: 0 });
  const recent = React.useRef<string[]>([]);
  const thoughtRef = React.useRef<string | null>(null);

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

  // Mirrored into a ref so the antics loop can check it without re-subscribing.
  // Written in an effect, never during render.
  React.useEffect(() => {
    thoughtRef.current = thought;
  }, [thought]);

  // ── antics ───────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (reduced) return;

    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let timer: number;
    let cancelled = false;

    /** Drift back to where it lives, unhurried. */
    const goHome = () =>
      Promise.all([
        tween(tx, home.current.x, { duration: 1.5, ease: [0.33, 0, 0.2, 1] }).finished,
        tween(ty, home.current.y, { duration: 1.5, ease: [0.33, 0, 0.2, 1] }).finished,
      ]);

    const antics = {
      /** Kicks over to whatever you are looking at, hangs about, goes home. */
      async visit() {
        // If the pointer has not moved yet — keyboard user, fresh load — it
        // visits the middle of the window instead of silently skipping its
        // turn and leaving a minute of nothing.
        const p = pointer.current ?? {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };
        const side = p.x > window.innerWidth / 2 ? -1 : 1;
        const spot = clampToViewport({ x: p.x + side * 120 - SIZE / 2, y: p.y + 20 });
        setGoofy(true);
        await Promise.all([
          tween(tx, spot.x, { duration: 1.1, ease: [0.2, 0.8, 0.3, 1] }).finished,
          tween(ty, spot.y, { duration: 1.1, ease: [0.2, 0.8, 0.3, 1] }).finished,
        ]);
        setGoofy(false);
        // A beat of just being there before it heads back.
        await new Promise((r) => setTimeout(r, 2600));
        await goHome();
      },

      /** A slow forward tumble. Astronauts do this constantly and on purpose. */
      async somersault() {
        setGoofy(true);
        await tween(spin, spin.get() + 360, { duration: 2.4, ease: [0.4, 0, 0.3, 1] })
          .finished;
        setGoofy(false);
      },

      /** Pushes off too hard, runs out of tether, gets snapped back. */
      async tetherRecoil() {
        const from = { x: tx.get(), y: ty.get() };
        const away = clampToViewport({ x: from.x - 190, y: from.y - 90 });
        setGoofy(true);
        await Promise.all([
          tween(tx, away.x, { duration: 0.5, ease: "easeOut" }).finished,
          tween(ty, away.y, { duration: 0.5, ease: "easeOut" }).finished,
        ]);
        await Promise.all([
          tween(tx, from.x, { type: "spring", stiffness: 210, damping: 9 }).finished,
          tween(ty, from.y, { type: "spring", stiffness: 210, damping: 9 }).finished,
          tween(spin, spin.get() + 180, { duration: 1.1 }).finished,
        ]);
        setGoofy(false);
      },

      /** Tumbles across in an arc and comes back, showing off slightly. */
      async barrelRoll() {
        const from = { x: tx.get(), y: ty.get() };
        const over = clampToViewport({ x: from.x - 150, y: from.y - 40 });
        setGoofy(true);
        await Promise.all([
          tween(tx, over.x, { duration: 1.3, ease: "easeInOut" }).finished,
          tween(ty, over.y, { duration: 1.3, ease: "easeInOut" }).finished,
          tween(spin, spin.get() + 720, { duration: 1.3, ease: "linear" }).finished,
        ]);
        setGoofy(false);
        await goHome();
      },
    };

    const kinds = Object.values(antics);

    const schedule = () => {
      // 45-95 seconds. Rare enough that catching one feels like catching it.
      timer = window.setTimeout(run, 45_000 + Math.random() * 50_000);
    };

    const run = async () => {
      if (cancelled) return schedule();
      // Never while being carried, never into a tab nobody is watching, and
      // never on top of a thought it is in the middle of having.
      if (document.hidden || draggingRef.current || thoughtRef.current) return schedule();
      try {
        await kinds[Math.floor(Math.random() * kinds.length)]();
      } catch {
        // An interrupted animation is not an error worth surfacing.
      }
      if (!cancelled) schedule();
    };

    // The first one comes sooner, so it introduces itself.
    timer = window.setTimeout(run, 14_000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced, tx, ty, spin]);

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
    : goofy
      ? "goofy"
      : urgent > 0
        ? "alert"
        : thought
          ? "curious"
          : idleMs > 120_000
            ? "sleepy"
            : "calm";

  return (
    <motion.div className="fixed left-0 top-0 z-50" style={{ x, y, rotate: spin, opacity, touchAction: "none" }}>
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
