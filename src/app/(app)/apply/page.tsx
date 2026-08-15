"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ExternalLink, Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MotionList, MotionListItem } from "@/components/motion/primitives";
import { getApplyQueue, prefillJob, type QueueRow } from "@/lib/api/apply-queue";
import { advanceApplication } from "@/lib/api/applications";
import { isLiveApi } from "@/lib/api/client";

/**
 * One list, worked top to bottom.
 *
 * Every piece of this existed and none of it met: applications sit in `ready`,
 * `priority()` knows what is worth doing next, the aging alarm knows what is
 * going stale, and `prefill_apply.py` can open a form with 20-odd fields
 * already answered. The only way to use any of it was eight steps and two
 * context switches, per application, starting from the jobs list.
 *
 * So this is not new capability, it is the missing surface. The measured cost
 * is what makes it worth having: the queue currently holds 23 applications and
 * about 276 minutes of form-filling, most of it Workday at 22 minutes each
 * against Greenhouse at 4.
 *
 * **Nothing here submits.** "Open pre-filled" drives a visible browser that is
 * structurally incapable of clicking submit — the element collector never even
 * selects a `<button>`. "Mark applied" is bookkeeping about something the
 * candidate did, and says so.
 */
export default function ApplyQueuePage() {
  const live = isLiveApi();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["apply-queue"],
    queryFn: getApplyQueue,
    enabled: live,
    retry: false,
  });

  const [busy, setBusy] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<Set<string>>(new Set());

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Apply queue" description="Prepared applications, in order." />
        <EmptyState
          icon={AlertCircle}
          title="The queue needs the CareerOS API"
          description="It is built from your real applications. Start the backend on port 8000."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Apply queue" description="Prepared applications, in order." />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Apply queue" description="Prepared applications, in order." />
        <EmptyState
          icon={AlertCircle}
          title="Couldn't read the queue"
          description="Showing nothing rather than an empty list, which would read as 'you're all caught up'."
          className="flex-1"
        />
      </div>
    );
  }

  const q = data.data;
  const rows = q.queue.filter((r) => !done.has(r.jobId));
  const hours = Math.round((q.estimatedMinutes / 60) * 10) / 10;

  async function openPrefilled(row: QueueRow) {
    setBusy(row.jobId);
    try {
      const res = await prefillJob(row.jobId);
      if (res.ok) {
        toast.success(`${row.company} opened pre-filled`, {
          description: "Check the highlighted fields, then submit it yourself.",
        });
      } else {
        toast.error("Couldn't open the form", { description: res.message });
      }
    } finally {
      setBusy(null);
    }
  }

  async function markApplied(row: QueueRow) {
    setDone((prev) => new Set(prev).add(row.jobId));
    await advanceApplication(`app_${row.jobId}`);
    toast.success(`${row.company} marked as applied`, {
      description: "CareerOS did not submit this — it records that you did.",
    });
    void refetch();
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Apply queue"
        description="Prepared and unsent, ordered by what is going stale first."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile value={rows.length} label="waiting" />
        <Tile value={q.aging} label={`over ${q.staleAfterDays} days`} tone={q.aging ? "warn" : undefined} />
        <Tile value={done.size} label="done this session" tone={done.size ? "good" : undefined} />
        <Tile value={hours} label="hours of forms" suffix="h" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Queue is clear"
          description="Nothing is prepared and waiting. New applications arrive here once a resume is tailored."
          className="flex-1"
        />
      ) : (
        <MotionList className="space-y-2">
          {rows.map((row) => (
            <MotionListItem key={row.jobId} layoutId={row.jobId}>
              <Row
                row={row}
                busy={busy === row.jobId}
                onOpen={() => openPrefilled(row)}
                onApplied={() => markApplied(row)}
              />
            </MotionListItem>
          ))}
        </MotionList>
      )}

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{q.note}</p>
    </div>
  );
}

function Row({
  row,
  busy,
  onOpen,
  onApplied,
}: {
  row: QueueRow;
  busy: boolean;
  onOpen: () => void;
  onApplied: () => void;
}) {
  return (
    <div
      className={`rounded-lg border bg-card px-4 py-3 ${
        row.aging ? "border-warning/40" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{row.title}</span>
            <span className="text-xs text-muted-foreground">{row.company}</span>
            {row.aging && (
              <Badge variant="outline" className="border-warning/40 text-warning">
                waiting {row.daysWaiting}d
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span>fit {row.fitScore}</span>
            {row.resumeScore != null && <span>resume {row.resumeScore}</span>}
            {row.platform && <span>{row.platform}</span>}
            {row.estimatedMinutes != null && (
              <span className={row.estimatedMinutes >= 18 ? "text-warning" : ""}>
                ~{row.estimatedMinutes} min
              </span>
            )}
            {!row.aging && row.daysWaiting != null && <span>{row.daysWaiting}d ready</span>}
          </div>
          {/* Only a real blocker is amber. A routine "Review and approve"
              sits on every ready application, and colouring all of them
              warning taught the colour to mean nothing. */}
          {row.note && (
            <p className={`mt-1.5 text-xs ${row.blocked ? "text-warning" : "text-muted-foreground"}`}>
              {row.note}
            </p>
          )}
          {!row.live && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Not in the current source pool — the posting may have moved or closed.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" onClick={onOpen} disabled={busy}>
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
            ) : (
              <ExternalLink className="size-3.5" strokeWidth={1.75} />
            )}
            {busy ? "Opening…" : "Open pre-filled"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onApplied}>
            <Check className="size-3.5" strokeWidth={1.75} />
            Mark applied
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tile({
  value,
  label,
  tone,
  suffix = "",
}: {
  value: number;
  label: string;
  tone?: "warn" | "good";
  suffix?: string;
}) {
  const colour =
    tone === "warn" ? "text-warning" : tone === "good" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className={`font-display text-2xl font-semibold tabular-nums ${colour}`}>
        {value}
        {suffix}
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
