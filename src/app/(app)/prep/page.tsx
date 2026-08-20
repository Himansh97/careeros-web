"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Square, RotateCcw, PlugZap, Radar } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { isLiveApi } from "@/lib/api/client";
import {
  getPrepOverview,
  submitAttempt,
  type AttemptResult,
  type Findings,
  type Question,
  type SystemCheck,
} from "@/lib/api/prep";
import { useSpeech } from "@/lib/hooks/use-speech";
import { cn } from "@/lib/utils";

/**
 * Interview practice, read as a launch poll.
 *
 * Each competency is a system that is GO, HOLD or NO-GO. A question never
 * attempted is NO-GO rather than blank, because not knowing whether you can
 * answer something is not the same as being ready for it — which is the whole
 * reason a launch poll calls every station rather than only the worried ones.
 *
 * The evidence panel is the point of the screen. It is deterministic, always
 * present, and it never says a figure is false: an unverified number means the
 * evidence file has no record of it, and the offered action is to record it.
 */

const STATUS_STYLES: Record<SystemCheck["status"], string> = {
  GO: "text-[--color-success] border-[--color-success]/40 bg-[--color-success]/5",
  HOLD: "text-[--color-warning] border-[--color-warning]/40 bg-[--color-warning]/5",
  "NO-GO": "text-muted-foreground border-border",
};

function StatusPill({ status }: { status: SystemCheck["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em]",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

function EvidencePanel({ findings }: { findings: Findings }) {
  const { backedFigures, unverifiedFigures, unsourcedNames } = findings;
  const band = findings.targetSeconds;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
        Evidence check
      </h3>

      <dl className="mt-3 grid gap-2 text-sm">
        {backedFigures.map((b) => (
          <div key={b.figure} className="flex flex-wrap items-baseline gap-2">
            <dt className="font-mono text-[--color-success]">{b.figure}</dt>
            <dd className="text-muted-foreground">
              verified — {b.employer}{" "}
              <span className="font-mono text-[11px] opacity-60">{b.claimId}</span>
            </dd>
          </div>
        ))}

        {unverifiedFigures.map((f) => (
          <div key={f} className="flex flex-wrap items-baseline gap-2">
            <dt className="font-mono text-[--color-warning]">{f}</dt>
            {/* Never "false". The evidence file is an incomplete record of a
                career, and a gap in it is not a lie. */}
            <dd className="text-muted-foreground">
              no claim on file records this — worth adding if it is real
            </dd>
          </div>
        ))}

        {backedFigures.length === 0 && unverifiedFigures.length === 0 && (
          <div className="text-muted-foreground">
            No figures in this answer. Interviewers remember numbers.
          </div>
        )}
      </dl>

      {unsourcedNames.length > 0 && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
          Named but not in any claim:{" "}
          <span className="text-foreground">{unsourcedNames.join(", ")}</span>
        </p>
      )}

      <p className="mt-3 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
        {findings.words} words · {Math.round(findings.seconds)}s spoken (target{" "}
        {band[0]}–{band[1]}s ·{" "}
        <span
          className={cn(
            findings.length === "good"
              ? "text-[--color-success]"
              : "text-[--color-warning]",
          )}
        >
          {findings.length}
        </span>
        ){findings.fillerCount > 0 && ` · ${findings.fillerCount} filler words`}
      </p>
    </div>
  );
}

function CritiquePanel({ result }: { result: AttemptResult }) {
  if (!result.critiqueAvailable || !result.critique) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Coaching was not available for this answer — no model configured, or the
        daily budget is spent. The evidence check above still ran.
      </div>
    );
  }

  const c = result.critique;
  const scores = Object.entries(c.scores);

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-foreground">
        Coaching
      </h3>
      <p className="mt-2 text-sm text-foreground">{c.verdict}</p>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
        {scores.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-mono tabular-nums text-sm">{value}/10</span>
          </div>
        ))}
      </div>

      {([["What worked", c.strengths], ["Fix", c.fixes], ["They will ask next", c.followUps]] as const).map(
        ([heading, items]) =>
          items.length > 0 && (
            <div key={heading} className="mt-3 border-t border-border pt-3">
              <h4 className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                {heading}
              </h4>
              <ul className="mt-1 grid gap-1 text-sm">
                {items.map((item) => (
                  <li key={item} className="text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}
    </div>
  );
}

export default function PrepPage() {
  const queryClient = useQueryClient();
  const speech = useSpeech();
  const [active, setActive] = React.useState<Question | null>(null);
  const [typed, setTyped] = React.useState("");
  const [result, setResult] = React.useState<AttemptResult | null>(null);

  const overview = useQuery({
    queryKey: ["prep", "overview"],
    queryFn: getPrepOverview,
    enabled: isLiveApi(),
  });
  const answer = speech.transcript || typed;

  const submit = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("no question selected");
      return submitAttempt({
        questionId: active.id,
        answer,
        spoken: Boolean(speech.transcript),
        durationSeconds: speech.elapsed > 0 ? speech.elapsed : null,
      });
    },
    onSuccess: (res) => {
      if (res.ok) setResult(res.data);
      void queryClient.invalidateQueries({ queryKey: ["prep", "overview"] });
    },
  });

  const begin = (question: Question) => {
    setActive(question);
    setResult(null);
    setTyped("");
    speech.reset();
  };

  if (!isLiveApi()) {
    return (
      <>
        <PageHeader title="Interview prep" description="Practice, checked against your evidence." />
        <EmptyState
          icon={PlugZap}
          title="Not connected"
          description="Start the API to practise. Nothing here is stored in the browser."
        />
      </>
    );
  }

  const data = overview.data?.ok ? overview.data.data : null;

  return (
    <>
      <PageHeader
        title="Interview prep"
        description="Answer out loud. Every figure you say is checked against your evidence."
      />

      {/* ---- the launch poll ------------------------------------------- */}
      {overview.isLoading ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : data ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
            <span>
              <span className="text-foreground tabular-nums">
                {data.go}/{data.total}
              </span>{" "}
              GO
            </span>
            <span>
              <span className="text-foreground tabular-nums">{data.attempts}</span>{" "}
              attempts
            </span>
            <span>
              <span className="text-foreground tabular-nums">{data.streakDays}</span>{" "}
              day streak
            </span>
          </div>

          <div className="grid gap-1.5">
            {data.systems.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  begin({ id: s.id, competency: s.competency, prompt: s.prompt })
                }
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/30",
                  active?.id === s.id && "border-foreground/40",
                )}
              >
                <StatusPill status={s.status} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-foreground">{s.prompt}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {s.competency}
                    {s.attempts > 0 && ` · ${s.attempts} attempts · best ${s.best}/10`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={Radar}
          title="Could not read your prep status"
          description="The API answered, but not with a readiness board. Nothing has been lost."
        />
      )}

      {/* ---- the answer ------------------------------------------------ */}
      {active && (
        <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">{active.prompt}</h2>

          {speech.supported ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={speech.listening ? "destructive" : "default"}
                onClick={speech.listening ? speech.stop : speech.start}
              >
                {speech.listening ? (
                  <>
                    <Square className="size-4" /> Stop
                  </>
                ) : (
                  <>
                    <Mic className="size-4" /> Answer out loud
                  </>
                )}
              </Button>
              <span className="font-mono tabular-nums text-sm text-muted-foreground">
                {Math.floor(speech.elapsed / 60)}:
                {String(Math.floor(speech.elapsed % 60)).padStart(2, "0")}
              </span>
              {(speech.transcript || speech.elapsed > 0) && (
                <Button type="button" variant="ghost" size="sm" onClick={speech.reset}>
                  <RotateCcw className="size-4" /> Reset
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This browser cannot transcribe speech — Chrome and Safari can. Type
              your answer instead; the timing will be estimated from its length.
            </p>
          )}

          {speech.error && (
            <p className="text-sm text-[--color-warning]">{speech.error}</p>
          )}

          <Textarea
            value={speech.transcript ? `${speech.transcript}${speech.interim ? ` ${speech.interim}` : ""}` : typed}
            onChange={(e) => setTyped(e.target.value)}
            readOnly={Boolean(speech.transcript)}
            rows={6}
            placeholder="Speak, or type your answer here."
            className="font-sans"
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={!answer.trim() || submit.isPending || speech.listening}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? "Checking…" : "Check this answer"}
            </Button>
            {speech.listening && (
              <span className="text-sm text-muted-foreground">
                Stop recording first.
              </span>
            )}
          </div>
        </section>
      )}

      {result && (
        <section className="grid gap-3">
          <EvidencePanel findings={result.findings} />
          <CritiquePanel result={result} />
        </section>
      )}
    </>
  );
}
