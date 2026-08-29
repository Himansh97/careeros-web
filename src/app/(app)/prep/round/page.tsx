"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AlertCircle, ArrowRight, Check, Flame, GraduationCap, Mic } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CountUp, useMotionSafe } from "@/components/motion/primitives";
import { CountdownRing } from "@/components/round/countdown-ring";
import { ConceptFlashcard } from "@/components/concepts/concept-card";
import { cn } from "@/lib/utils";
import { completeRound, getRound, type RoundItem } from "@/lib/api/round";
import { listConcepts, reviewConcept, type ConceptRating } from "@/lib/api/concepts";

/**
 * Today's round: three things thirty live postings are asking about.
 *
 * The point of it being a round rather than a deck is that it ends. Three items,
 * a clock that does not matter, a streak, and then it is gone until tomorrow —
 * which is the opposite of a queue of 158 that is never finished and therefore
 * never started.
 *
 * Each item carries the number of staged jobs that named it, because that is the
 * argument for doing it at all. "Eighteen of the jobs you are applying to ask
 * about this" is a reason; "it is next in the list" is not.
 *
 * A behavioural item does not get a card. It hands off to the STAR drill in
 * /prep, which grades a story against the evidence file. Asking someone to
 * define "process improvement" would waste the most demanded requirement in the
 * whole pipeline on a question nobody wants answered.
 */

const SECONDS_PER_ITEM = 60;

function DemandBadge({ item }: { item: RoundItem }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-full border border-primary/25 bg-primary/[0.06] px-2 py-0.5">
      <span className="font-mono text-xs font-medium tabular-nums text-primary">
        {item.demand}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {item.demand === 1 ? "job asks" : "jobs ask"}
      </span>
    </span>
  );
}

export default function RoundPage() {
  const queryClient = useQueryClient();
  const motionSafe = useMotionSafe();

  const round = useQuery({ queryKey: ["round"], queryFn: getRound, retry: false });
  const concepts = useQuery({ queryKey: ["concepts"], queryFn: listConcepts, retry: false });

  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [scored, setScored] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  const finish = useMutation({
    mutationFn: (points: number) => completeRound(points),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["round"] });
      void queryClient.invalidateQueries({ queryKey: ["concepts"] });
    },
  });

  if (round.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!round.data?.ok) {
    return (
      <div className="space-y-4">
        <PageHeader title="Today's round" description="Three things your pipeline is asking about." />
        <EmptyState
          icon={AlertCircle}
          title="Not connected"
          description="The CareerOS API isn't reachable — start it on port 8000."
        />
      </div>
    );
  }

  const state = round.data.data;
  const items = state.items;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Today's round" description="Three things your pipeline is asking about." />
        <EmptyState
          icon={AlertCircle}
          title="Nothing staged to draw from"
          description="The round is built from requirements named by jobs sitting at ready or draft. Tailor a resume for a role and it will have something to ask you about."
        />
      </div>
    );
  }

  const alreadyDone = state.completed && !finished;
  const item = items[Math.min(index, items.length - 1)];
  const cards = concepts.data?.ok ? concepts.data.data.cards : [];
  const card = cards.find((c) => c.term === item?.term) ?? null;

  async function advance(rating?: ConceptRating) {
    if (!item) return;
    // "good" or "easy" is a point. The score is a nudge, not a grade — nothing
    // downstream reads it.
    const point = rating === "good" || rating === "easy" ? 1 : 0;
    const total = scored + point;
    setScored(total);

    if (item.kind === "concept" && rating) {
      await reviewConcept(item.term, rating);
    }

    if (index + 1 >= items.length) {
      setFinished(true);
      await finish.mutateAsync(total);
      return;
    }
    setIndex(index + 1);
    setRevealed(false);
  }

  // ---- finished, or already done today -----------------------------------
  if (finished || alreadyDone) {
    const streak = finished ? state.streak + (state.completed ? 0 : 1) : state.streak;
    return (
      <div className="space-y-5">
        <PageHeader title="Today's round" description="Done. Back tomorrow with three more." />
        <motion.div
          initial={motionSafe ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-card px-5 py-6"
        >
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-primary" strokeWidth={1.75} />
            <span className="font-display text-4xl font-semibold tabular-nums text-foreground">
              <CountUp value={streak} />
            </span>
            <span className="text-sm text-muted-foreground">
              day{streak === 1 ? "" : "s"} in a row
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {finished ? `${scored} of ${items.length} answered cleanly.` : "Already worked today."}
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link href="/prep/concepts">
              Open the full deck
              <ArrowRight className="size-3.5" strokeWidth={1.75} />
            </Link>
          </Button>
        </motion.div>

        <ul className="space-y-2">
          {items.map((done) => (
            <li
              key={done.term}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <Check className="size-4 text-success" strokeWidth={1.75} />
              <span className="text-sm font-medium text-foreground">{done.term}</span>
              <DemandBadge item={done} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ---- working through -----------------------------------------------------
  return (
    <div className="space-y-5">
      <PageHeader
        title="Today's round"
        description="Three things the jobs you're applying to actually ask about."
        action={
          state.streak > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Flame className="size-4 text-primary" strokeWidth={1.75} />
              <span className="font-medium tabular-nums text-foreground">{state.streak}</span>
              day streak
            </span>
          ) : undefined
        }
      />

      {/* Progress as three pips rather than a bar: three is countable at a
          glance, and a bar at 33% reads as a long way to go. */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {items.map((pip, i) => (
            <motion.span
              key={pip.term}
              className={cn(
                "h-1.5 rounded-full",
                i < index ? "bg-success" : i === index ? "bg-primary" : "bg-border",
              )}
              animate={{ width: i === index ? 32 : 16 }}
              transition={{ duration: motionSafe ? 0.25 : 0 }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {index + 1} of {items.length}
        </span>
        <div className="ml-auto">
          <CountdownRing
            // Remount per item so the clock restarts without syncing state
            // from a prop inside an effect.
            key={item.term}
            seconds={SECONDS_PER_ITEM}
            running={!revealed}
            onElapsed={() => setRevealed(true)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.term}
          initial={motionSafe ? { opacity: 0, x: 24 } : false}
          animate={{ opacity: 1, x: 0 }}
          exit={motionSafe ? { opacity: 0, x: -24 } : undefined}
          transition={{ duration: 0.24 }}
        >
          {/* Why this item is in front of you, before anything else. */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {item.kind !== "lesson" && <DemandBadge item={item} />}
            {item.companies.length > 0 && (
              <span className="text-xs text-muted-foreground">
                including {item.companies.slice(0, 3).join(", ")}
              </span>
            )}
          </div>

          {item.kind === "lesson" ? (
            // A lesson is not answered here — it is taught elsewhere. The round
            // puts it in front of you and hands off; grading a lesson would be
            // grading whether you read something.
            <div className="rounded-lg border border-border bg-card p-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                {item.track} · {item.level}
              </span>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                {item.term}
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                Next in the track. It is taught rather than tested — read it, interrupt
                as much as you like, and come back.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/prep/learn/${item.lessonId}`}>
                    <GraduationCap className="size-3.5" strokeWidth={1.75} />
                    Teach me this
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => void advance("good")}>
                  Already know it
                </Button>
                <Button variant="ghost" onClick={() => void advance("again")}>
                  Skip for now
                </Button>
              </div>
            </div>
          ) : item.kind === "behavioural" ? (
            // No card for these, deliberately. A story graded against the
            // evidence file is the only honest way to practise them.
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {item.term}
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                There is no definition worth reciting for this one. {item.demand} of the
                jobs you have staged name it, and what they are asking for is a time you
                did it — which /prep will check against your evidence, figure by figure.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/prep?q=${encodeURIComponent(item.questionId)}`}>
                    <Mic className="size-3.5" strokeWidth={1.75} />
                    Answer it out loud
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => void advance("good")}>
                  I have a story ready
                </Button>
                <Button variant="ghost" onClick={() => void advance("again")}>
                  Not yet
                </Button>
              </div>
            </div>
          ) : card ? (
            <ConceptFlashcard
              card={card}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
              onRate={(rating) => void advance(rating)}
              rating={null}
            />
          ) : (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {item.term}
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                {item.demand} of your staged jobs ask for this and no card has been written
                for it yet. Say out loud what it is and how you have used it — then mark
                whether that came easily.
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void advance("good")}>Came easily</Button>
                <Button variant="outline" onClick={() => void advance("hard")}>
                  Struggled
                </Button>
                <Button variant="ghost" onClick={() => void advance("again")}>
                  No idea
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
