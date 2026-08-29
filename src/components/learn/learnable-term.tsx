"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Diagram } from "@/components/diagram/diagram";
import { cn } from "@/lib/utils";
import { explainTerm } from "@/lib/api/learn";

/**
 * A requirement you can learn without leaving the application you were making.
 *
 * This is the answer to "let me learn while I'm applying". Everything built
 * before it was a destination — a deck, a round, a track — and a destination is
 * something you have to decide to visit. The requirement matrix on a job page
 * is already open, already relevant, and already the moment you are wondering
 * whether you can defend a term. So the term itself becomes the door.
 *
 * Matching used to happen here, against an exact card term and a lesson title
 * substring, and it resolved roughly one requirement in ten: a posting says
 * "ETL", "Airflow", "A/B testing", and no lesson is called any of those. The
 * server resolves it now, using the same alias vocabulary that scoring uses
 * plus a `teaches` list authored per lesson.
 *
 * A term nothing teaches stays plain text. That silence is the reason the
 * dotted underline is worth trusting when it does appear.
 */
export function LearnableTerm({
  term,
  className,
}: {
  term: string;
  className?: string;
}) {
  const explained = useQuery({
    queryKey: ["explain", term.toLowerCase()],
    queryFn: () => explainTerm(term),
    retry: false,
    // Requirements repeat constantly across postings, and the answer only
    // changes when the curriculum does.
    staleTime: 30 * 60 * 1000,
  });

  const result = explained.data?.ok ? explained.data.data : undefined;
  const card = result?.card ?? null;
  const lesson = result?.lesson ?? null;

  if (!card && !lesson) {
    return <span className={className}>{term}</span>;
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-left underline decoration-dotted decoration-muted-foreground/50 underline-offset-4",
            "hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          title={`What is ${term}?`}
        >
          {term}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{card?.term ?? term}</SheetTitle>
          <SheetDescription>
            This posting screens on it. Thirty seconds now beats finding out in the room.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 py-3">
          {card?.claims && card.claims.length > 0 && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                What you actually did
              </h3>
              {card.claims.map((claim) => (
                <figure key={claim.claimId} className="mt-2 border-l-2 border-primary/40 pl-3">
                  <blockquote className="text-sm leading-relaxed text-foreground">
                    {claim.claim}
                  </blockquote>
                  <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {claim.employer}
                  </figcaption>
                </figure>
              ))}
            </section>
          )}

          {card?.simple && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                In plain English
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{card.simple}</p>
            </section>
          )}

          {card?.visual && <Diagram spec={card.visual} />}

          {card?.application && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Where it shows up
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{card.application}</p>
            </section>
          )}

          {/* The lesson's own diagram. On a `sequence` this is the played
              explainer — the thirty seconds that make the term stick get spent
              here, on the job page, without going anywhere. */}
          {lesson && (
            <section className={cn(card && "border-t border-border pt-5")}>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {lesson.track} · {lesson.level}
              </h3>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                {lesson.title}
              </p>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                {lesson.hook}
              </p>
              {lesson.visual && (
                <div className="mt-3">
                  <Diagram spec={lesson.visual} />
                </div>
              )}
            </section>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {lesson && (
              <Button asChild size="sm">
                <Link href={`/prep/learn/${lesson.id}`}>
                  <GraduationCap className="size-3.5" strokeWidth={1.75} />
                  Teach me properly
                </Link>
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/prep/concepts">
                <BookOpen className="size-3.5" strokeWidth={1.75} />
                Open the deck
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
