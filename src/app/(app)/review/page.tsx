"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tether } from "@/components/review/tether";
import { DepthField } from "@/components/review/depth-field";
import { Reading, ReviewSection } from "@/components/review/review-section";
import { listAlerts, listSkillGaps } from "@/lib/api/ops";
import { listApprovals } from "@/lib/api/approvals";
import { listEvidence } from "@/lib/api/evidence";
import { isLiveApi } from "@/lib/api/client";

/**
 * Mission Review — where the job search actually stands.
 *
 * This is the weekly review that was specced as "Strategy Mode" and never
 * built. Every figure on the page is read live from an endpoint and its source
 * is printed beside it; nothing is computed here that the API does not already
 * compute, because a review that drifts from the system it reviews is worse
 * than no review.
 *
 * **It reports state, not trend.** There is no snapshot history, and the submit
 * dates that do exist are unevenly sourced — six of ten were reconstructed
 * during a backfill rather than observed. A week-over-week panel would read
 * "10 vs 0" and look like a breakout, when it is an artefact of when the column
 * was added. The same rule the funnel already follows in refusing to divide
 * below thirty submissions.
 *
 * **Nothing here encourages.** The readings are the readings. A line of
 * reassurance next to "0 interviews" would be the one dishonest sentence in an
 * application built to avoid exactly that.
 */
const STOPS = ["Crew", "Consumables", "Trajectory", "Caution", "Next"];

export default function ReviewPage() {
  const live = isLiveApi();
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: listAlerts, enabled: live });
  const gaps = useQuery({ queryKey: ["skill-gaps"], queryFn: listSkillGaps, enabled: live });
  const approvals = useQuery({ queryKey: ["approvals", "review"], queryFn: listApprovals, enabled: live });
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: listEvidence, enabled: live });

  if (!live) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Review needs the CareerOS API"
        description="Every figure here is read live. Rather than render zeros that look like findings, it shows nothing."
        className="flex-1"
      />
    );
  }

  const loading =
    alerts.isLoading || gaps.isLoading || approvals.isLoading || evidence.isLoading;
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // A failed read must not render as zeros. Zero interviews and "could not
  // count interviews" look identical on a dashboard and mean opposite things.
  const failed = [alerts, gaps, approvals, evidence].some((q) => q.data && !q.data.ok);
  if (failed) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't read the full picture"
        description="At least one reading failed. Showing a partial review would misreport where you stand — start the backend on port 8000 and reload."
        className="flex-1"
      />
    );
  }

  const funnel = alerts.data?.ok ? alerts.data.data.funnel : null;
  const alertList = alerts.data?.ok ? alerts.data.data.alerts : [];
  const urgent = alerts.data?.ok ? alerts.data.data.high : 0;
  const topGaps = gaps.data?.ok ? gaps.data.data.gaps : [];
  const claims = evidence.data?.ok ? evidence.data.data.claims : [];
  const approved = evidence.data?.ok ? evidence.data.data.approvedForResume : 0;
  const pending = approvals.data?.ok ? approvals.data.data.filter((a) => a.status === "pending") : [];

  const held = pending.filter((a) => a.commit?.verdict === "nogo").length;
  const caution = pending.filter((a) => a.commit?.verdict === "caution").length;
  const clear = pending.length - held - caution;
  const gap = topGaps[0];

  // The single most severe actionable thing. Derived by precedence, not by an
  // invented score — an urgent alert outranks a queue backlog, which outranks
  // an evidence gap.
  const nextBurn = urgent > 0
    ? alertList.find((a) => a.severity === "high")
    : null;

  return (
    <div className="relative">
      <DepthField />
      <Tether sections={STOPS} />

      <div className="pl-10 sm:pl-16 lg:pl-24">
        <header className="border-b border-border pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Mission review
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-foreground">
            Where this stands
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Read live, every figure sourced. State only — trend needs history this
            search does not have yet.
          </p>
        </header>

        <ReviewSection index={1} total={5} call="CREW" heading="You" source="alerts.funnel">
          <div className="grid gap-6 sm:grid-cols-3">
            <Reading value={funnel?.submitted ?? 0} label="applications submitted" />
            <Reading
              value={funnel?.responded ?? 0}
              label="employers responded"
              tone={funnel?.responded ? "success" : "muted"}
            />
            <Reading
              value={funnel?.interviews ?? 0}
              label="interviews"
              tone={funnel?.interviews ? "success" : "muted"}
            />
          </div>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {funnel?.note}
            {funnel?.inferredTimestamps
              ? ` ${funnel.inferredTimestamps} of those submit dates were reconstructed rather than observed, so treat the timing loosely.`
              : ""}
          </p>
        </ReviewSection>

        <ReviewSection index={2} total={5} call="CONSUMABLES" heading="What you can draw on" source="api/evidence">
          <div className="grid gap-6 sm:grid-cols-2">
            <Reading value={claims.length} label="claims on record" />
            <Reading
              value={approved}
              label="cleared for resumes"
              note={
                claims.length > approved
                  ? `${claims.length - approved} held back — designed work stays available for interviews without being written as delivered.`
                  : undefined
              }
            />
          </div>
          {gap && (
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Largest gap:{" "}
              <span className="font-medium text-foreground">{gap.skill}</span>, in{" "}
              {gap.shareOfTargets}% of the roles you score well on
              {gap.requiredIn > 0 ? `, required in ${gap.requiredIn}` : ""}.{" "}
              {gap.note}.{" "}
              <Link href="/analytics" className="text-primary underline-offset-4 hover:underline">
                Close it
              </Link>
            </p>
          )}
        </ReviewSection>

        <ReviewSection index={3} total={5} call="TRAJECTORY" heading="What is queued" source="api/approvals">
          <div className="grid gap-6 sm:grid-cols-3">
            <Reading value={clear} label="clear to apply" tone={clear ? "success" : "muted"} />
            <Reading value={caution} label="go, with notes" tone={caution ? "warning" : "muted"} />
            <Reading value={held} label="held" tone={held ? "warning" : "muted"} />
          </div>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {held > 0
              ? "Held items cannot proceed as they stand — below the fit floor, or the req has left its board."
              : "Nothing is held. Every queued item passed its commit criteria."}{" "}
            <Link href="/approvals" className="text-primary underline-offset-4 hover:underline">
              Open the queue
            </Link>
          </p>
        </ReviewSection>

        <ReviewSection index={4} total={5} call="CAUTION" heading="Waiting on you" source="api/alerts">
          <div className="grid gap-6 sm:grid-cols-2">
            <Reading
              value={urgent}
              label="urgent"
              tone={urgent ? "warning" : "success"}
            />
            <Reading value={alertList.length} label="outstanding in total" tone="muted" />
          </div>
          <ul className="mt-6 max-w-xl space-y-1.5">
            {alertList.slice(0, 5).map((a, i) => (
              <li key={`${a.kind}-${a.ref ?? i}`} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                    a.severity === "high" ? "bg-warning" : "bg-muted-foreground/40"
                  }`}
                />
                <span className="text-muted-foreground">{a.title}</span>
              </li>
            ))}
          </ul>
        </ReviewSection>

        <ReviewSection index={5} total={5} call="NEXT" heading="The next thing" source="derived by severity">
          {nextBurn ? (
            <div className="max-w-xl">
              <p className="font-display text-2xl font-semibold leading-snug tracking-tight text-foreground">
                {nextBurn.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {nextBurn.detail}
              </p>
              <p className="mt-3 text-sm font-medium text-primary">{nextBurn.action}.</p>
            </div>
          ) : clear > 0 ? (
            <div className="max-w-xl">
              <p className="font-display text-2xl font-semibold leading-snug tracking-tight text-foreground">
                {clear} application{clear === 1 ? "" : "s"} cleared and unsent.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Nothing is blocking these. CareerOS does not submit — that part is
                yours.
              </p>
              <Link
                href="/approvals"
                className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open the queue
              </Link>
            </div>
          ) : (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Nothing outstanding and nothing queued.
            </p>
          )}
        </ReviewSection>
      </div>
    </div>
  );
}
