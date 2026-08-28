"use client";

import * as React from "react";
import { Loader2, Quote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConceptCard as Card, ConceptRating } from "@/lib/api/concepts";

/**
 * One term, and the two things worth knowing about it.
 *
 * The order is deliberate and it is the opposite of a normal flashcard. What
 * *you* did comes first, because that is what the interviewer's second question
 * asks and it is the half that cannot be bluffed. The general meaning comes
 * second, as support.
 *
 * Reciting a definition is explicitly not the goal — the model-answer panel in
 * /prep already makes the argument, that "an answer that sounds memorised is
 * worse than one that wanders". So the card is framed as a prompt to say
 * something out loud, and the answer it reveals is the candidate's own sentence.
 *
 * A term with no seeded definition still shows. Saying so is honest; the
 * alternative is generating one, and a generated definition arrives with a
 * fabricated citation attached.
 */

const RATINGS: { value: ConceptRating; label: string; hint: string }[] = [
  { value: "again", label: "No idea", hint: "back tomorrow" },
  { value: "hard", label: "Struggled", hint: "same box" },
  { value: "good", label: "Got it", hint: "next box" },
  { value: "easy", label: "Easy", hint: "skip a box" },
];

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
          {card.mentions === 1
            ? "On one claim only — the kind most likely to be probed."
            : `On ${card.mentions} of your claims.`}
        </p>
      </div>

      {!revealed ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            Say out loud what this is and what you did with it. Then check
            yourself against your own claim.
          </p>
          <Button onClick={onReveal}>Show my claim</Button>
        </div>
      ) : (
        <div className="flex-1 space-y-4 px-4 py-4">
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              What you actually did
            </h3>
            <div className="mt-2 space-y-3">
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
          </section>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              What it means generally
            </h3>
            {card.hasDefinition ? (
              <>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground">
                  {card.definition}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {card.sources.map((source) => (
                    <li key={source} className="truncate font-mono text-[10px] text-muted-foreground">
                      {source}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              /* Stated, not hidden. A blank space would read as "there is
                 nothing to know here", which is the opposite of true. */
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                No sourced definition written yet. Definitions are researched and
                stored with their sources rather than generated, so this one is
                simply outstanding — your claim above is still the answer that
                matters.
              </p>
            )}
          </section>
        </div>
      )}

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
