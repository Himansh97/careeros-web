"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  CornerDownLeft,
  GraduationCap,
  Loader2,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  explainBack,
  getDefendSet,
  type CheckedPoint,
  type DefendItem,
} from "@/lib/api/learn";

/**
 * Explain one requirement in your own words, right after you applied for it.
 *
 * The moment is the whole design. Everything else built for studying is a
 * destination you have to decide to visit, and nobody decides to visit one.
 * This appears where you already are, one minute after you told a company you
 * know Airflow — which is exactly when finding out whether you can say what
 * Airflow is stops feeling like homework and starts feeling like preparation.
 *
 * It never blocks the application. Staging stays instant and ignoring this
 * costs nothing; a gate here would turn the fastest part of the app into a quiz
 * and be switched off within a week.
 *
 * There is no score. The check returns what the explanation carried, what it
 * missed, and what it stated backwards, because "did I pass" is the question
 * this is meant to replace.
 */
export function DefendIt({ jobId }: { jobId: string }) {
  const set = useQuery({
    queryKey: ["defend", jobId],
    queryFn: () => getDefendSet(jobId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const [index, setIndex] = React.useState(0);
  const [said, setSaid] = React.useState("");

  const data = set.data?.ok ? set.data.data : undefined;
  const items = data?.items ?? [];
  const item: DefendItem | undefined = items[index];

  const check = useMutation({
    mutationFn: (text: string) =>
      explainBack(text, { lessonId: item?.lessonId, term: item?.term }),
  });
  const checked = check.data?.ok ? check.data.data : undefined;
  const result = checked?.ok ? checked : undefined;

  const move = (to: number) => {
    setIndex(to);
    setSaid("");
    check.reset();
  };

  // Nothing on this posting has material written for it. Say nothing at all
  // rather than render an empty prompt — most of the value of this appearing is
  // that it only appears when it has something.
  if (!data || items.length === 0) return null;
  if (!item) return null;

  const enough = said.trim().length >= 40;

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Say it in your own words
          </h2>
          <p className="mt-0.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
            You just told {data.company} you know this. The interview will ask
            you to explain it — so explain it here first, while it costs nothing.
          </p>
        </div>
        <span className="font-mono text-[10px] tabular-nums uppercase tracking-[0.14em] text-muted-foreground">
          {index + 1}/{items.length}
          {data.settledCount > 0 && ` · ${data.settledCount} settled`}
        </span>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-base font-medium text-foreground">{item.term}</span>
        <Badge variant={item.importance === "required" ? "default" : "outline"}>
          {item.importance}
        </Badge>
        {item.claimed && (
          <Badge variant="outline" className="text-muted-foreground">
            on your resume
          </Badge>
        )}
      </div>

      {!result && (
        <>
          <Textarea
            value={said}
            onChange={(e) => setSaid(e.target.value)}
            rows={5}
            className="mt-3 text-sm leading-relaxed"
            placeholder={`Explain ${item.term} to a smart colleague who has never used it. Plain words are better than the textbook ones — that is the point.`}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={!enough || check.isPending}
              onClick={() => check.mutate(said)}
            >
              {check.isPending ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <CornerDownLeft className="size-3.5" strokeWidth={1.75} />
              )}
              Check what I left out
            </Button>
            {items.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => move((index + 1) % items.length)}>
                Different one
                <ArrowRight className="size-3.5" strokeWidth={1.75} />
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {enough
                ? `checked against ${item.points} ideas`
                : "a couple of sentences at least"}
            </span>
          </div>
          {/* Two ways this fails and they mean different things: the request
              never landed, or it landed and the server declined to check. */}
          {check.data && !check.data.ok && (
            <p className="mt-2 text-xs text-destructive">
              {check.data.message ?? "the check did not run"}
            </p>
          )}
          {check.data?.ok && !check.data.data.ok && (
            <p className="mt-2 text-xs text-destructive">
              {check.data.data.reason}
            </p>
          )}
        </>
      )}

      {result?.ok && (
        <div className="mt-4 space-y-4">
          {result.settled ? (
            <p className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2} />
              You carried every idea. That is what being able to answer it in the
              room looks like — this one is marked explained.
            </p>
          ) : (
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {result.backwards.length > 0
                ? "One thing here is inverted, which is worth more than anything you missed — it is the kind of answer that sounds confident and is wrong."
                : "Nothing you said was wrong. These are the ideas the explanation did not reach."}
            </p>
          )}

          {/* Backwards first. It is the only category that says you believe
              something false, and burying it under a list of misses would be
              exactly the wrong emphasis. */}
          <PointList
            label="Stated backwards"
            tone="bad"
            points={result.backwards}
          />
          <PointList label="Not reached" tone="muted" points={result.missed} />
          <PointList label="Carried" tone="good" points={result.carried} />

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {result.next && (
              <Button asChild size="sm">
                <Link
                  href={`/prep/learn/${result.lessonId}?stuck=${encodeURIComponent(
                    result.next.point,
                  )}`}
                >
                  <GraduationCap className="size-3.5" strokeWidth={1.75} />
                  Teach me just that
                </Link>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { setSaid(said); check.reset(); }}>
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
              Say it again
            </Button>
            {items.length > 1 && (
              <Button size="sm" variant="ghost" onClick={() => move((index + 1) % items.length)}>
                Next requirement
                <ArrowRight className="size-3.5" strokeWidth={1.75} />
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PointList({
  label,
  tone,
  points,
}: {
  label: string;
  tone: "good" | "bad" | "muted";
  points: CheckedPoint[];
}) {
  if (points.length === 0) return null;
  return (
    <section>
      <h3
        className={cn(
          "font-mono text-[10px] uppercase tracking-[0.16em]",
          tone === "bad" && "text-destructive",
          tone === "good" && "text-primary",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {label} · {points.length}
      </h3>
      <ul className="mt-2 space-y-2">
        {points.map((p) => (
          <li
            key={p.n}
            className={cn(
              "border-l-2 pl-3 text-sm leading-relaxed",
              tone === "bad" ? "border-destructive/50" : "border-border",
              tone === "good" ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {p.point}
            {p.quote && (
              // Their own words, verbatim — the server drops anything that is
              // not a real span of what they wrote, so this can be shown as a
              // quotation without qualification.
              <span className="mt-1 block text-xs italic text-muted-foreground">
                you wrote: “{p.quote}”
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
