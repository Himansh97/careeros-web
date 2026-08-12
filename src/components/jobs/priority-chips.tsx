"use client";

import { Clock, Timer, ShieldCheck, ShieldAlert } from "lucide-react";
import type { Job } from "@/types/job";

/**
 * The three things that decide whether a job is worth the next twenty minutes,
 * beside the fit score that decides whether it is worth wanting.
 *
 * Shown as separate facts rather than folded into one number, because each is
 * independently actionable: a stale posting is a reason to move fast, a
 * 22-minute Workday form is a reason to batch it, and a trust concern is a
 * reason to look at the employer's own careers page first.
 */
export function PriorityChips({ job, compact = false }: { job: Job; compact?: boolean }) {
  const p = job.priority;
  if (!p) return null;

  const lowTrust = p.trust.score < 50;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {!compact && (
        <span
          className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary"
          title={`Based on ${p.basis}. ${p.excludes}`}
        >
          Priority {p.score}
        </span>
      )}
      <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
        <Timer className="size-3" strokeWidth={1.75} />
        {p.friction.minutes} min
        {p.friction.extras.length > 0 && ` + ${p.friction.extras[0]}`}
      </span>
      {p.freshness.days !== null && p.freshness.days <= 2 && (
        <span className="inline-flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-success">
          <Clock className="size-3" strokeWidth={1.75} />
          {p.freshness.note}
        </span>
      )}
      {lowTrust ? (
        <span
          className="inline-flex items-center gap-1 rounded bg-warning/10 px-1.5 py-0.5 text-warning"
          title={p.trust.concerns.join(" · ")}
        >
          <ShieldAlert className="size-3" strokeWidth={1.75} />
          Check first
        </span>
      ) : (
        !compact && (
          <span
            className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground"
            title={p.trust.signals.join(" · ")}
          >
            <ShieldCheck className="size-3" strokeWidth={1.75} />
            {p.trust.verdict}
          </span>
        )
      )}
    </div>
  );
}
