"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * One stop in the review.
 *
 * Each holds a single reading and says where it came from. The source line is
 * not a footnote — a review that cannot be traced back to an endpoint is just
 * an opinion with numbers in it, and this whole product is built on the
 * opposite premise.
 *
 * Sections are full-height so scrolling lands on one at a time, and the panel
 * lifts very slightly on approach. Under reduced motion everything renders in
 * place with no reveal, because a document that hides its own content until you
 * move is a worse document.
 */
export function ReviewSection({
  call,
  heading,
  source,
  index,
  total,
  children,
}: {
  /** The station call sign — the same vocabulary the pre-flight poll uses. */
  call: string;
  heading: string;
  /** Which endpoint this reading came from. Stated, not implied. */
  source: string;
  /** Position in the sequence. Numbering is only used because these really
   *  are ordered stops — a numbered list of unordered things is decoration. */
  index?: number;
  total?: number;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });

  return (
    <section
      ref={ref}
      className="flex min-h-[85vh] flex-col justify-center border-b border-border py-14 last:border-b-0"
    >
      <motion.div
        style={{ perspective: 900 }}
        initial={reduced ? false : { opacity: 0, y: 20, rotateX: 3 }}
        animate={reduced || inView ? { opacity: 1, y: 0, rotateX: 0 } : undefined}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div className="mb-1 flex flex-wrap items-baseline gap-2">
          {index !== undefined && total !== undefined && (
            <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] text-muted-foreground/50">
              {String(index).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            {call}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {source}
          </span>
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {heading}
        </h2>
        <motion.div
          className="mt-3 h-px w-full origin-left bg-primary/30"
          initial={reduced ? false : { scaleX: 0 }}
          animate={reduced || inView ? { scaleX: 1 } : undefined}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
        />
        <div className="mt-5">{children}</div>
      </motion.div>
    </section>
  );
}

/** A single reading: a number, what it is, and nothing implied around it. */
export function Reading({
  value,
  label,
  note,
  tone = "default",
}: {
  value: string | number;
  label: string;
  note?: string;
  tone?: "default" | "warning" | "success" | "muted";
}) {
  const toneClass = {
    default: "text-foreground",
    warning: "text-warning",
    success: "text-success",
    muted: "text-muted-foreground",
  }[tone];

  return (
    <div>
      <div
        className={`font-display text-4xl font-semibold leading-none tracking-tight tabular-nums ${toneClass}`}
      >
        {value}
      </div>
      <div className="mt-1.5 h-px w-full bg-current opacity-15" />
      <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      {note && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  );
}
