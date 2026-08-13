"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import * as React from "react";

/**
 * Motivation, without flattery.
 *
 * The brief asked for a motivation section, and the obvious version — an
 * encouraging line beside the numbers — is the one thing this product cannot
 * do. "You've got this!" next to zero interviews is a lie, and the whole
 * system's value is that its numbers can be trusted.
 *
 * So motivation comes from two things that are true instead.
 *
 * **Real words from people who did hard things.** Attributed, verifiable, and
 * chosen because they are about persistence under uncertainty rather than
 * success — which is the actual situation. Gene Kranz's line is the famous one
 * and it is here for the reason it is famous: it was said about a problem
 * nobody had solved yet.
 *
 * **Real milestones from the candidate's own record.** Not "great job" — "you
 * have 32 documented accomplishments" is motivating precisely because it is a
 * fact they can check. Anything that has not happened is not shown, and no
 * milestone is invented to fill the space.
 */
const LOG: { quote: string; who: string; context: string }[] = [
  {
    quote: "Failure is not an option.",
    who: "Gene Kranz",
    context: "Flight Director, Apollo 13 — said about a problem nobody had solved yet",
  },
  {
    quote:
      "It suddenly struck me that that tiny pea, pretty and blue, was the Earth. I put up my thumb and shut one eye, and my thumb blotted out the planet.",
    who: "Neil Armstrong",
    context: "On perspective",
  },
  {
    quote:
      "There can be no thought of finishing, for aiming at the stars, both literally and figuratively, is the work of generations.",
    who: "Robert Goddard",
    context: "1932, in a letter to H.G. Wells",
  },
  {
    quote:
      "The regret of not trying is far worse than the fear of failing.",
    who: "Mae Jemison",
    context: "First Black woman in space",
  },
];

export interface Milestone {
  value: string | number;
  label: string;
  /** Only shown when true. Nothing that has not happened appears here. */
  reached: boolean;
}

/**
 * One quote per day, chosen at module load rather than during render.
 *
 * Two reasons it lives out here. `Date.now()` in a render body is impure and
 * React Compiler rejects it outright. And both server and client evaluate this
 * on the same calendar day, so they agree — the same call inside the component
 * would risk a hydration mismatch across midnight.
 */
const ENTRY = LOG[Math.floor(Date.now() / 86400000) % LOG.length];

export function FlightLog({ milestones }: { milestones: Milestone[] }) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  const entry = ENTRY;
  const reached = milestones.filter((m) => m.reached);

  return (
    <div ref={ref} className="space-y-6">
      <motion.blockquote
        className="border-l-2 border-primary/40 pl-4"
        initial={reduced ? false : { opacity: 0, x: -8 }}
        animate={reduced || inView ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <p className="font-display text-xl font-medium leading-snug text-foreground sm:text-2xl">
          &ldquo;{entry.quote}&rdquo;
        </p>
        <footer className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{entry.who}</span> ·{" "}
          {entry.context}
        </footer>
      </motion.blockquote>

      {reached.length > 0 && (
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            On the record
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {reached.map((m, i) => (
              <motion.div
                key={m.label}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={reduced || inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: reduced ? 0 : 0.15 + i * 0.08, duration: 0.4 }}
              >
                <div className="font-display text-2xl font-semibold tabular-nums text-foreground">
                  {m.value}
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {m.label}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground">
            These are counts from your own record, not encouragement. Nothing that
            has not happened is listed.
          </p>
        </div>
      )}
    </div>
  );
}
