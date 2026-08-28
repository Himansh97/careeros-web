"use client";

import * as React from "react";
import { Lightbulb, Route, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";


export function HintLadder({
  conceptual,
  pattern,
  unlocked,
  solutionRevealed,
  onRevealSolution,
}: {
  conceptual: string;
  pattern: string;
  unlocked: { conceptual: boolean; pattern: boolean; solutionRevealAvailable: boolean };
  solutionRevealed: boolean;
  onRevealSolution: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);

  return (
    <section aria-labelledby="hint-heading" className="border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 id="hint-heading" className="font-mono text-[11px] tracking-[0.15em] uppercase">
          Guidance ladder
        </h3>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Lightbulb className="size-4" aria-hidden="true" /> Concept nudge
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {unlocked.conceptual ? conceptual : "Unlocks after your first check."}
          </p>
        </div>
        <div className="bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Route className="size-4" aria-hidden="true" /> Useful pattern
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {unlocked.pattern ? pattern : "Unlocks after two checks."}
          </p>
        </div>
      </div>
      {unlocked.solutionRevealAvailable && !solutionRevealed && (
        <div className="border-t border-border p-4">
          {confirming ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex gap-2 text-sm text-warning">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                This attempt cannot earn independent mastery after you reveal the worked solution.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>Keep trying</Button>
                <Button size="sm" onClick={onRevealSolution}>Reveal and keep practising</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
              Show worked solution
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
