"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Quote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/primitives";
import { Diagram } from "@/components/diagram/diagram";
import type { ConceptCard as Card, ConceptRating } from "@/lib/api/concepts";

/**
 * One term, explained in layers.
 *
 * The order is deliberate and, for a resume term, it is the opposite of a normal
 * flashcard: what *you* did comes first. That is what the interviewer's second
 * question asks and it is the half that cannot be bluffed. Then the precise
 * definition, the plain-English one, the same in Hindi, where it shows up in
 * practice, and a picture — because a term you have never met is not made
 * familiar by precision, it is made familiar by a plain sentence and a shape.
 *
 * A topic card has no claim behind it and says so by simply not showing that
 * layer. It leads with the definition instead, and its prompt asks a different
 * question, because "what did you do with it" has no answer for a concept that
 * is not on the resume.
 *
 * Reciting is explicitly not the goal — /prep's model-answer panel already
 * argues that "an answer that sounds memorised is worse than one that wanders".
 * So the card asks you to say it out loud first, and only then reveals.
 *
 * Layers marked "restated" were written by a model from the sourced definition.
 * They assert nothing it does not, which is why they are allowed to exist; the
 * label is the price of that.
 */

const RATINGS: { value: ConceptRating; label: string; hint: string }[] = [
  { value: "again", label: "No idea", hint: "back tomorrow" },
  { value: "hard", label: "Struggled", hint: "same box" },
  { value: "good", label: "Got it", hint: "next box" },
  { value: "easy", label: "Easy", hint: "skip a box" },
];

/**
 * One rung of the explanation, labelled.
 *
 * `derived` marks the layers a model restated from the sourced definition
 * rather than a source asserting them directly. Saying so is the price of
 * generating them at all: the definition carries citations, its restatements
 * carry a label admitting what they are.
 */
function Layer({
  label,
  children,
  derived = false,
  tone = "muted",
}: {
  label: string;
  children: React.ReactNode;
  derived?: boolean;
  tone?: "muted" | "primary";
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2">
        <h3
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.16em]",
            tone === "primary" ? "text-primary" : "text-muted-foreground",
          )}
        >
          {label}
        </h3>
        {derived && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
            restated
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function ConceptFlashcard({
  card,
  revealed,
  onReveal,
  onRate,
  rating,
}: {
  card: Card;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: ConceptRating) => void;
  rating: ConceptRating | null;
}) {
  const safe = useMotionSafe();

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {card.term}
          </h2>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground tabular-nums">
            box {card.box}/{card.maxBox}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {card.mentions === 0
            ? `${card.layers} of 5 layers${card.hasDefinition ? "" : " — not written up yet"}`
            : card.mentions === 1
              ? "On one claim only — the kind most likely to be probed."
              : `On ${card.mentions} of your claims.`}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
      {!revealed ? (
        <motion.div
          key="front"
          initial={safe ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={safe ? { opacity: 0 } : undefined}
          transition={{ duration: 0.15 }}
          className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center"
        >
          <p className="max-w-sm text-sm text-muted-foreground">
            {card.claims.length > 0
              ? "Say out loud what this is and what you did with it. Then check yourself against your own claim."
              : "Say out loud what this is and where you would use it. Then check yourself."}
          </p>
          <Button onClick={onReveal}>
            {card.claims.length > 0 ? "Show my claim" : "Show the answer"}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="back"
          initial={safe ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex-1 space-y-5 px-4 py-4"
        >
          {card.claims.length > 0 && (
            <Layer label="What you actually did" tone="primary">
              <div className="space-y-3">
                {card.claims.map((claim) => (
                  <figure key={claim.claimId} className="border-l-2 border-primary/40 pl-3">
                    <blockquote className="text-sm leading-relaxed text-foreground">
                      <Quote className="mr-1 inline size-3 text-muted-foreground" strokeWidth={1.75} />
                      {claim.claim}
                    </blockquote>
                    <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {claim.employer}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Layer>
          )}

          {card.hasDefinition ? (
            <>
              <Layer label="Definition">
                <p className="max-w-prose text-sm leading-relaxed text-foreground">
                  {card.definition}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {card.sources.map((source) => (
                    <li key={source} className="truncate font-mono text-[10px] text-muted-foreground">
                      {source}
                    </li>
                  ))}
                </ul>
              </Layer>

              {card.simple && (
                <Layer label="In plain English" derived={card.derived.includes("simple")}>
                  <p className="max-w-prose text-sm leading-relaxed text-foreground">
                    {card.simple}
                  </p>
                </Layer>
              )}

              {card.hindi && (
                <Layer label="हिन्दी में" derived={card.derived.includes("hindi")}>
                  {/* Geist carries no Devanagari; without this class every
                      character here is a tofu box. */}
                  <p lang="hi" className="font-devanagari max-w-prose text-sm text-foreground">
                    {card.hindi}
                  </p>
                </Layer>
              )}

              {card.application && (
                <Layer label="Where it shows up" derived={card.derived.includes("application")}>
                  <p className="max-w-prose text-sm leading-relaxed text-foreground">
                    {card.application}
                  </p>
                </Layer>
              )}

              {card.visual && (
                <Layer label="Picture it" derived={card.derived.includes("visual")}>
                  <Diagram spec={card.visual} />
                </Layer>
              )}
            </>
          ) : (
            <Layer label="What it means generally">
              {/* Stated, not hidden. A blank space would read as "there is
                  nothing to know here", which is the opposite of true. */}
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                No sourced definition written yet. Definitions are researched and
                stored with their sources rather than generated, so this one is
                simply outstanding{card.claims.length > 0
                  ? " — your claim above is still the answer that matters."
                  : "."}
              </p>
            </Layer>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {revealed && (
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-4">
          {RATINGS.map((option) => (
            <Button
              key={option.value}
              variant={option.value === "good" ? "default" : "outline"}
              size="sm"
              disabled={rating !== null}
              onClick={() => onRate(option.value)}
              className={cn("flex-col gap-0 py-1.5 h-auto")}
            >
              {rating === option.value ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <>
                  <span className="text-xs">{option.label}</span>
                  <span className="text-[10px] font-normal opacity-70">{option.hint}</span>
                </>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
