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
import { listConcepts } from "@/lib/api/concepts";
import { listLessons } from "@/lib/api/learn";

/**
 * A requirement you can learn without leaving the application you were making.
 *
 * This is the answer to "let me learn while I'm applying". Everything built
 * before it was a destination — a deck, a round, a track — and a destination is
 * something you have to decide to visit. The requirement matrix on a job page
 * is already open, already relevant, and already the moment you are wondering
 * whether you can defend a term. So the term itself becomes the door.
 *
 * It costs nothing when ignored: a term with no card is plain text, and the
 * concepts list is already in the query cache from elsewhere, so opening one
 * makes no request.
 */
export function LearnableTerm({
  term,
  className,
}: {
  term: string;
  className?: string;
}) {
  const concepts = useQuery({
    queryKey: ["concepts"],
    queryFn: listConcepts,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const lessons = useQuery({
    queryKey: ["lessons"],
    queryFn: () => listLessons(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const card = concepts.data?.ok
    ? concepts.data.data.cards.find(
        (c) => c.term.toLowerCase() === term.toLowerCase() && c.hasDefinition,
      )
    : undefined;

  // A lesson whose title or concept slug names this requirement. Looser than
  // the card match on purpose — "SQL" should reach the SQL track even though no
  // lesson is called "SQL".
  const lesson = lessons.data?.ok
    ? lessons.data.data.lessons.find(
        (l) =>
          l.track.toLowerCase() === term.toLowerCase() ||
          l.title.toLowerCase().includes(term.toLowerCase()),
      )
    : undefined;

  // Nothing written for it yet — stay out of the way entirely rather than
  // offering a door that opens onto an apology.
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
