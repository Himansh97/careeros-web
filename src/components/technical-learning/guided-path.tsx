"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CaseResponse } from "./case-response";
import { HintLadder } from "./hint-ladder";
import { ResultGrid } from "./result-grid";
import { SchemaBrowser } from "./schema-browser";
import { SqlEditor } from "./sql-editor";
import { isLiveApi } from "@/lib/api/client";
import {
  getTechnicalDrill,
  runTechnicalSql,
  submitTechnicalAttempt,
  type AttemptResult,
  type QueryResult,
  type TechnicalDrill,
} from "@/lib/api/technical-learning";
import { guidedReducer, initialGuidedState, recoverDraft, saveDraft, type GuidedStep } from "@/lib/technical-learning/state";
import { cn } from "@/lib/utils";

const STEPS: { id: GuidedStep; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "example", label: "Example" },
  { id: "practice", label: "Practice" },
  { id: "review", label: "Review" },
  { id: "transfer", label: "Transfer" },
];

function Workbench({ drill }: { drill: TechnicalDrill }) {
  const queryClient = useQueryClient();
  const [state, dispatch] = React.useReducer(guidedReducer, drill.id, initialGuidedState);
  const [answer, setAnswer] = React.useState(() => {
    if (typeof window === "undefined") return drill.starter_answer;
    return recoverDraft(window.localStorage, drill.id) || drill.starter_answer;
  });
  const [preview, setPreview] = React.useState<QueryResult | null>(null);
  const [result, setResult] = React.useState<AttemptResult | null>(null);

  const updateAnswer = (value: string) => {
    setAnswer(value);
    if (typeof window !== "undefined") saveDraft(window.localStorage, drill.id, value);
  };

  const run = useMutation({
    mutationFn: () => runTechnicalSql(drill.id, answer),
    onSuccess: (response) => {
      if (response.ok) setPreview(response.data);
    },
  });
  const check = useMutation({
    mutationFn: (solutionRevealed: boolean) =>
      submitTechnicalAttempt({
        drillId: drill.id,
        answer,
        hintsUnlocked: Number(state.hints.conceptual) + Number(state.hints.pattern),
        solutionRevealed,
      }),
    onSuccess: (response) => {
      if (!response.ok) return;
      setResult(response.data);
      if (!response.data.grade.passed) dispatch({ type: "failed" });
      dispatch({ type: "go-to", step: "review" });
      void queryClient.invalidateQueries({ queryKey: ["technical", "overview"] });
    },
  });

  const revealSolution = () => {
    dispatch({ type: "reveal-solution" });
    check.mutate(true);
  };
  const hints = result?.hints ?? {
    conceptual: state.hints.conceptual,
    pattern: state.hints.pattern,
    solutionRevealAvailable: state.failures >= 2,
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <Link href="/prep/technical" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Mission map
        </Link>
        <ol className="flex flex-wrap items-center gap-1" aria-label="Learning steps">
          {STEPS.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => dispatch({ type: "go-to", step: step.id })}
                aria-current={state.step === step.id ? "step" : undefined}
                className={cn(
                  "px-2 py-1 font-mono text-[10px] tracking-[0.12em] uppercase focus-visible:outline-2",
                  state.step === step.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {index + 1} {step.label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <header className="grid gap-3 border-b border-border pb-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">{drill.skill.replaceAll("-", " ")} · {drill.difficulty}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">{drill.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{drill.brief}</p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{drill.stage === "transfer" ? "Transfer check" : "Guided drill"}</span>
      </header>

      {(state.step === "brief" || state.step === "example") && (
        <section className="grid gap-px border border-border bg-border md:grid-cols-2">
          <div className="bg-card p-6">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">The assignment</p>
            <p className="mt-4 text-lg leading-7">{drill.prompt}</p>
          </div>
          <div className="bg-card p-6">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Worked reasoning</p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{drill.example}</p>
          </div>
          <div className="bg-card p-4 md:col-span-2">
            <Button onClick={() => dispatch({ type: "continue" })}>Continue to {state.step === "brief" ? "example" : "practice"}</Button>
          </div>
        </section>
      )}

      {(state.step === "practice" || state.step === "transfer") && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid min-w-0 gap-3">
            <div className="border border-border bg-card p-4">
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Challenge</p>
              <p className="mt-2 text-sm leading-6">{drill.prompt}</p>
            </div>
            {drill.kind === "sql" ? <SqlEditor value={answer} onChange={updateAnswer} onRun={() => run.mutate()} /> : <CaseResponse value={answer} onChange={updateAnswer} />}
            {drill.kind === "sql" && <div className="border border-border bg-card"><ResultGrid result={preview} /></div>}
            <div className="flex flex-wrap gap-2">
              {drill.kind === "sql" && <Button variant="outline" onClick={() => run.mutate()} disabled={run.isPending}><Play className="size-4" /> Run <span className="hidden font-mono text-[10px] opacity-60 sm:inline">⌘↵</span></Button>}
              <Button onClick={() => check.mutate(state.solutionRevealed)} disabled={check.isPending || !answer.trim()}>Check answer</Button>
            </div>
          </div>
          <div className="grid content-start gap-4">
            <SchemaBrowser tables={drill.schema ?? []} />
            <HintLadder conceptual={drill.hints.conceptual} pattern={drill.hints.pattern} unlocked={hints} solutionRevealed={state.solutionRevealed} onRevealSolution={revealSolution} />
          </div>
        </div>
      )}

      {state.step === "review" && (
        <section className="grid gap-4">
          <div className={cn("border-l-4 border border-border bg-card p-6", result?.grade.passed ? "border-l-[--color-success]" : "border-l-[--color-warning]") }>
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Debrief</p><h2 className="mt-2 font-heading text-2xl">{result?.grade.passed ? "The result holds." : "One more pass."}</h2></div>
              {result?.grade.passed && <CheckCircle2 className="size-6 text-[--color-success]" aria-hidden="true" />}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{result?.grade.summary ?? "Check an answer to receive deterministic feedback."}</p>
            {result?.grade.differences.map((difference) => <p key={difference} className="mt-2 text-sm text-[--color-warning]">{difference}</p>)}
            <p className="mt-4 border-t border-border pt-4 text-sm leading-6">{result?.debrief ?? drill.debrief}</p>
            {result?.solution && <pre className="mt-4 overflow-x-auto border border-border bg-muted/40 p-4 font-mono text-xs whitespace-pre-wrap">{result.solution}</pre>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => dispatch({ type: "go-to", step: "practice" })}><RotateCcw className="size-4" /> Try again</Button>
            {result?.cleared && <Button onClick={() => dispatch({ type: "go-to", step: "transfer" })}>Take the transfer check</Button>}
          </div>
        </section>
      )}
    </div>
  );
}

export function GuidedPath({ drillId }: { drillId: string }) {
  const drill = useQuery({ queryKey: ["technical", "drill", drillId], queryFn: () => getTechnicalDrill(drillId), enabled: isLiveApi() && Boolean(drillId) });
  if (!isLiveApi()) return <div className="border border-border bg-card p-6"><h1 className="font-heading text-2xl">Technical Lab is not connected</h1><p className="mt-2 text-sm text-muted-foreground">Start the CareerOS API to load curriculum and save progress.</p></div>;
  if (drill.isLoading) return <div className="h-80 animate-pulse border border-border bg-muted" />;
  if (!drill.data?.ok) return <div role="alert" className="border border-border bg-card p-6">This drill could not be loaded.</div>;
  return <Workbench key={drill.data.data.id} drill={drill.data.data} />;
}
