"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import {
  CHECKS,
  commit,
  initialStations,
  type Station,
  type Verdict,
} from "@/components/preflight/stations";

/**
 * The pre-flight poll.
 *
 * The root route was `redirect("/dashboard")` — an empty gesture where the
 * entrance should be. It is now a launch status check: each station reports,
 * and any single NO-GO holds.
 *
 * Three rules keep this from being a splash screen:
 *
 * 1. **Every check is real.** FIDO names the sources that are actually down.
 *    A poll that always says GO would be the one dishonest surface in an
 *    application built around refusing to overstate anything.
 * 2. **It never traps you.** Skip is visible from the first frame, Escape
 *    works, and it runs once per browser session. A daily tool that makes you
 *    watch a countdown every morning is a worse tool than one that doesn't.
 * 3. **Reduced motion gets the answer, not a slower animation.** The board
 *    renders complete and hands off immediately.
 */
const HOLD_MS = 620;
const STEP_MS = 340;
const SESSION_KEY = "careeros:preflight-shown";

const VERDICT_STYLE: Record<Verdict, { label: string; className: string }> = {
  go: { label: "GO", className: "text-success" },
  caution: { label: "CAUTION", className: "text-warning" },
  nogo: { label: "NO-GO", className: "text-primary" },
  pending: { label: "····", className: "text-muted-foreground/40" },
};

export function PreflightBoard() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const [stations, setStations] = React.useState<Station[]>(initialStations);
  const [done, setDone] = React.useState(false);
  const handedOff = React.useRef(false);

  const enter = React.useCallback(() => {
    if (handedOff.current) return;
    handedOff.current = true;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private browsing can refuse sessionStorage. Showing the poll again is
      // a far smaller problem than failing to open the app.
    }
    router.replace("/dashboard");
  }, [router]);

  // Already polled this session, or the user prefers reduced motion: go
  // straight in. The board has no information they have not already seen —
  // the alerts banner on the dashboard carries the same facts.
  React.useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) enter();
  }, [enter]);

  // Run the stations in order. Sequential rather than parallel on purpose:
  // a poll is a sequence, and each station's answer should land on its own.
  React.useEffect(() => {
    let cancelled = false;

    async function poll() {
      for (let i = 0; i < CHECKS.length; i += 1) {
        const result = await CHECKS[i]();
        if (cancelled) return;
        setStations((prev) => prev.map((s, idx) => (idx === i ? result : s)));
        if (!reduced) await new Promise((r) => setTimeout(r, STEP_MS));
      }
      if (cancelled) return;
      setDone(true);
      if (reduced) enter();
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [reduced, enter]);

  // Escape always works, from the first frame.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") enter();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enter]);

  // Hand off shortly after the final call so the verdict is readable.
  React.useEffect(() => {
    if (!done || reduced) return;
    const id = setTimeout(enter, HOLD_MS * 2);
    return () => clearTimeout(id);
  }, [done, reduced, enter]);

  const verdict = commit(stations);
  const held = verdict === "nogo";

  return (
    <main
      className="flex min-h-dvh flex-col justify-center bg-background px-6 py-10"
      aria-label="Pre-flight check"
    >
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-baseline justify-between border-b border-foreground/15 pb-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              CareerOS
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Pre-flight check
            </p>
          </div>
          <button
            onClick={enter}
            className="rounded-sm px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Skip · Esc
          </button>
        </header>

        <ol className="mt-1">
          {stations.map((station) => {
            const style = VERDICT_STYLE[station.verdict];
            const reported = station.verdict !== "pending";
            return (
              <li
                key={station.call}
                className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-3 border-b border-foreground/10 py-2.5"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {station.call}
                </span>
                <span
                  className={`min-w-0 text-sm ${
                    reported ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {reported ? station.readout : station.responsibility}
                </span>
                <span
                  className={`font-mono text-xs font-medium tracking-[0.1em] tabular-nums ${style.className}`}
                  aria-label={`${station.call}: ${style.label}`}
                >
                  {style.label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* The commit call. A single NO-GO holds — the same rule a real launch
            status check runs on, and the same rule this product's eligibility
            knockouts already follow. */}
        <div
          className="mt-5 flex flex-wrap items-baseline justify-between gap-3"
          aria-live="polite"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {done
              ? held
                ? "Hold — a station reported NO-GO"
                : verdict === "caution"
                  ? "Go with exceptions noted"
                  : "All stations go"
              : "Polling stations…"}
          </p>
          {done && (
            <button
              onClick={enter}
              className="font-display text-sm font-semibold tracking-tight text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {held ? "Continue anyway →" : "Enter →"}
            </button>
          )}
        </div>

        {held && (
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted-foreground">
            The app still opens. Screens that need the backend will say so rather
            than showing numbers they cannot stand behind.
          </p>
        )}
      </div>
    </main>
  );
}
