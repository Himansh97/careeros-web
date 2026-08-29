"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMotionSafe } from "@/components/motion/primitives";

/**
 * An explainer that plays — the closest thing to a video that is still data.
 *
 * A static diagram shows the parts. A process has an order, and order is the
 * thing a still picture is worst at: the reader has to reconstruct the sequence
 * from arrows and numbering, which is the work the diagram was supposed to do.
 *
 * So this walks the stages, narrating one line at a time. It is deliberately
 * not a video file: it stays in the app's own type and colours, works in both
 * themes, is readable by a screen reader, weighs nothing, and a wrong frame is
 * fixed by editing a string rather than re-rendering an export.
 *
 * Under `prefers-reduced-motion` it does not autoplay and shows every stage at
 * once with all narration visible — the whole explanation is still there, it
 * simply arrives as a list instead of a performance. Nothing is carried by the
 * motion alone.
 */

export interface SequenceStep {
  /** Indices of the nodes lit at this stage. */
  active: number[];
  /** The one line of narration for this stage. */
  say: string;
  /** Nodes to mark as the failure at this stage, if any. */
  bad?: number[];
}

export interface SequenceSpec {
  kind: "sequence";
  caption?: string;
  nodes: { label: string; note?: string }[];
  steps: SequenceStep[];
}

const STEP_MS = 2200;

export function Sequence({ spec }: { spec: SequenceSpec }) {
  const motionSafe = useMotionSafe();
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);

  React.useEffect(() => {
    if (!motionSafe || !playing) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % spec.steps.length),
      STEP_MS,
    );
    return () => window.clearInterval(id);
  }, [motionSafe, playing, spec.steps.length]);

  // Reduced motion gets the whole thing at once. A person who asked for less
  // movement has not asked for less explanation.
  if (!motionSafe) {
    return (
      <figure className="rounded-lg border border-border bg-card/60 p-3">
        <ol className="space-y-2">
          {spec.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground">
                {step.say}
                <span className="ml-1 text-muted-foreground">
                  ({step.active.map((n) => spec.nodes[n]?.label).join(", ")})
                </span>
              </span>
            </li>
          ))}
        </ol>
        {spec.caption && (
          <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {spec.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  const step = spec.steps[index];

  return (
    <figure className="rounded-lg border border-border bg-card/60 p-3">
      {/* The stage. Nodes dim rather than disappear, so the whole shape stays
          visible and only the emphasis moves — otherwise each frame reads as a
          different diagram. */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
        {spec.nodes.map((node, i) => {
          const on = step.active.includes(i);
          const failed = step.bad?.includes(i);
          return (
            <React.Fragment key={node.label}>
              <motion.div
                animate={{ opacity: on ? 1 : 0.32, scale: on ? 1 : 0.98 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  "flex-1 rounded-md border p-2.5",
                  failed
                    ? "border-destructive/50 bg-destructive/10"
                    : on
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-card",
                )}
              >
                <div className="text-sm font-medium leading-snug text-foreground">
                  {node.label}
                </div>
                {node.note && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {node.note}
                  </p>
                )}
              </motion.div>
              {i < spec.nodes.length - 1 && (
                <span aria-hidden className="hidden shrink-0 self-center text-muted-foreground sm:block">
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* The narration. One line, replaced — a transcript would just be the
          static version with extra steps. */}
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        aria-live="polite"
        className="mt-3 min-h-[2.5rem] max-w-prose text-sm leading-relaxed text-foreground"
      >
        {step.say}
      </motion.p>

      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-3.5" strokeWidth={1.75} />
                   : <Play className="size-3.5" strokeWidth={1.75} />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => { setIndex(0); setPlaying(true); }}
          aria-label="Replay from the start"
        >
          <RotateCcw className="size-3.5" strokeWidth={1.75} />
        </Button>

        {/* Scrub. Clicking a stage pauses, because someone reaching for a
            specific frame wants it to stay there. */}
        <div className="flex flex-1 gap-1">
          {spec.steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Stage ${i + 1} of ${spec.steps.length}`}
              aria-current={i === index}
              onClick={() => { setIndex(i); setPlaying(false); }}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i === index ? "bg-primary" : i < index ? "bg-primary/40" : "bg-border",
              )}
            />
          ))}
        </div>

        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {index + 1}/{spec.steps.length}
        </span>
      </div>

      {spec.caption && (
        <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {spec.caption}
        </figcaption>
      )}
    </figure>
  );
}
