"use client";

import { CheckCircle2, CircleDashed, MessageSquareOff, Clock } from "lucide-react";
import type { Job } from "@/types/job";

/**
 * What this posting actually screens on.
 *
 * A job description is three things at once: requirements someone will check,
 * a wishlist nobody fully meets, and language that carries no requirement at
 * all. Shown as one undifferentiated list, an 11-item posting reads as eleven
 * bars to clear — and "5+ years" or "fast-paced environment" becomes a reason
 * not to apply.
 *
 * Years is reported and never used to disqualify. Whether a stated minimum is
 * worth testing is the candidate's call; the system's job is to stop it
 * reading as a wall.
 */
export function PostingBreakdown({ job }: { job: Job }) {
  const posting = job.posting;
  if (!posting) return null;

  const { required, preferred, filler, yearsRequested } = posting;
  if (required.length + preferred.length + filler.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">What they screen on</h2>
        {yearsRequested !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs text-warning">
            <Clock className="size-3" strokeWidth={1.75} />
            Asks for {yearsRequested}+ years — stated, not a rule
          </span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {required.length > 0 && (
          <Group
            icon={CheckCircle2}
            label="Real requirements"
            hint="Named in the title, repeated, or written as required."
            items={required}
            className="text-foreground"
          />
        )}
        {preferred.length > 0 && (
          <Group
            icon={CircleDashed}
            label="Wishlist"
            hint="Mentioned once or listed as nice-to-have. Rarely screened on."
            items={preferred}
            className="text-muted-foreground"
          />
        )}
        {filler.length > 0 && (
          <Group
            icon={MessageSquareOff}
            label="Filler"
            hint="Carries no requirement. Safe to ignore."
            items={filler}
            className="text-muted-foreground/70"
          />
        )}
      </div>
    </div>
  );
}

function Group({
  icon: Icon,
  label,
  hint,
  items,
  className,
}: {
  icon: typeof CheckCircle2;
  label: string;
  hint: string;
  items: string[];
  className: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${className}`} strokeWidth={1.75} />
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">· {items.length}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded bg-muted px-1.5 py-0.5 text-xs ${className}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
