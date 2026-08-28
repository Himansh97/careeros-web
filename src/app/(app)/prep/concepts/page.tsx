"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScoreAssay } from "@/components/score-assay";
import { StarChart } from "@/components/concepts/star-chart";
import { ConceptFlashcard } from "@/components/concepts/concept-card";
import {
  listConcepts,
  reviewConcept,
  type ConceptRating,
} from "@/lib/api/concepts";

/**
 * Every technical term on your own resume, as a sky you light up.
 *
 * The map and the deck are one thing rather than two: the chart is how you see
 * what you know and choose what to work on, and clicking a star is the drill.
 *
 * The number at the top is deliberately "known", not "ready". Readiness would
 * be a claim this page cannot support — self-rated recall is not a graded
 * answer, and the honest thing is to report what was rated rather than to infer
 * a readiness from it.
 */
export default function ConceptsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [pending, setPending] = React.useState<ConceptRating | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["concepts"],
    queryFn: listConcepts,
    retry: false,
  });

  const rate = useMutation({
    mutationFn: ({ term, rating }: { term: string; rating: ConceptRating }) =>
      reviewConcept(term, rating),
    onSettled: () => setPending(null),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="space-y-4">
        <PageHeader title="Concepts" description="The terms on your own resume." />
        <EmptyState
          icon={AlertCircle}
          title="Not connected"
          description="The CareerOS API isn't reachable — start it on port 8000."
        />
      </div>
    );
  }

  const { overview, cards } = data.data;
  const card = cards.find((c) => c.term === selected) ?? null;
  const due = cards.filter((c) => c.due);

  async function submit(rating: ConceptRating) {
    if (!card) return;
    setPending(rating);
    const res = await rate.mutateAsync({ term: card.term, rating });
    if (!res.ok) {
      toast.error("Couldn't record that");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["concepts"] });
    toast.success(`${card.term} — box ${res.data.box} of ${res.data.maxBox}`, {
      description: `Back in ${res.data.dueInDays} day${res.data.dueInDays === 1 ? "" : "s"}.`,
    });
    // Straight on to the next one due, so the deck can be worked without
    // returning to the chart between every card.
    const next = due.find((c) => c.term !== card.term) ?? null;
    setSelected(next?.term ?? null);
    setRevealed(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Concepts"
        description={
          `Every technical term on your resume, drawn as a sky. ` +
          `Brightness is how well you know it.`
        }
        action={
          due.length > 0 ? (
            <Button
              onClick={() => {
                setSelected(due[0].term);
                setRevealed(false);
              }}
            >
              Study {due.length} due
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-end gap-6 rounded-lg border border-border bg-card px-4 py-3">
        {/* A percentage, not the raw count: ScoreAssay stamps "/100" and says
            "out of 100" in its aria-label, so feeding it "known of 158" would
            put a false denominator on screen and a false sentence in a screen
            reader. The share genuinely is out of 100. */}
        <ScoreAssay
          score={
            overview.total === 0
              ? 0
              : Math.round((overview.known / overview.total) * 100)
          }
          basis={`${overview.known} of ${overview.total} terms known cold`}
        />
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {[
            ["Due now", overview.due],
            ["Learning", overview.learning],
            ["Never seen", overview.unseen],
            ["With a sourced definition", overview.withDefinition],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-baseline gap-1.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <StarChart
          cards={cards}
          selected={selected}
          onSelect={(term) => {
            setSelected(term);
            setRevealed(false);
          }}
        />

        <div className="lg:sticky lg:top-4 lg:self-start">
          {card ? (
            <ConceptFlashcard
              card={card}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
              onRate={(r) => void submit(r)}
              rating={pending}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Pick a star, or study the {due.length} due.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
