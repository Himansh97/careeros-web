"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getModelAnswer } from "@/lib/api/prep";
import { isLiveApi } from "@/lib/api/client";

/**
 * What a strong answer to this question looks like.
 *
 * Two layers, and the separation between them is the whole point of the panel.
 *
 * **The shape** is craft knowledge from published interview guidance — what the
 * interviewer is assessing, how to structure it, the traps. It is general, it is
 * not about this candidate, and it is rendered *with its sources*, because advice
 * with no provenance is indistinguishable from advice a model invented.
 *
 * **The draft** is that shape filled with the candidate's own evidence, and it is
 * refused rather than approximated if the containment gate finds a figure no claim
 * supports. When it is missing, the panel says why — a generic STAR answer with no
 * facts in it would be worse than nothing.
 */
export function ModelAnswer({ questionId }: { questionId: string }) {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["prep", "model-answer", questionId],
    queryFn: () => getModelAnswer(questionId),
    // Only on request: building the draft costs a model call, so it must not
    // fire merely because a question was selected.
    enabled: open && isLiveApi(),
    staleTime: 30 * 60 * 1000,
  });

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        What does a strong answer look like?
      </Button>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  const model = data?.ok ? data.data : null;
  if (!model) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load the model answer. Nothing you typed has been lost.
      </p>
    );
  }

  const { shape, draft } = model;

  return (
    <div className="grid gap-3">
      {shape ? (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
            What good looks like
          </h3>
          <p className="mt-2 text-sm text-foreground">
            <span className="text-muted-foreground">They are assessing: </span>
            {shape.assesses}
          </p>

          <ol className="mt-3 grid gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
            {shape.structure.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h4 className="mt-3 border-t border-border pt-3 font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
            What sinks this answer
          </h4>
          <ul className="mt-1 grid gap-1 text-sm text-muted-foreground">
            {shape.traps.map((trap) => (
              <li key={trap}>{trap}</li>
            ))}
          </ul>

          <p className="mt-3 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
            {shape.timing}
          </p>

          {/* Sourced, and shown to be. This is the one part of the screen that is
              not the candidate's own evidence. */}
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            Researched from:{" "}
            {shape.sources.map((s, i) => (
              <React.Fragment key={s.url}>
                {i > 0 && " · "}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {new URL(s.url).hostname.replace(/^www\./, "")}
                </a>
              </React.Fragment>
            ))}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No research on file for this question yet.
        </p>
      )}

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
          That shape, in your own evidence
        </h3>

        {draft ? (
          <>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {draft.answer}
            </p>
            <p className="mt-3 border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
              Every figure above traces to:{" "}
              {draft.claims.map((c) => c.claimId).join(" · ")}
            </p>
            {draft.reviewNotes.length > 0 && (
              <ul className="mt-2 grid gap-1 text-[11px] text-warning">
                {draft.reviewNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">
              A script to rehearse against, not to recite. Say it in your own words
              — an answer that sounds memorised is worse than one that wanders.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No draft for this one. Either no approved claim matches the competency,
            or every attempt introduced a figure your evidence does not support and
            was discarded. A generic answer with no facts in it would be worse than
            none — the shape above is still the thing to aim at.
          </p>
        )}
      </div>
    </div>
  );
}
