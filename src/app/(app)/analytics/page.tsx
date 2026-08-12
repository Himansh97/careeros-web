"use client";

import * as React from "react";
import { AlertCircle, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { SkillGaps } from "@/components/analytics/skill-gaps";
import { Skeleton } from "@/components/ui/skeleton";
import {
  subscribeApplications,
  getApplicationsSnapshot,
  getApplicationsLoadState,
} from "@/lib/api/applications";
import type { ApplicationRecord } from "@/types/application";

// A data source exists if either the live backend or the mock layer is on.
const hasDataSource = () =>
  process.env.NEXT_PUBLIC_API_URL !== "" && process.env.NEXT_PUBLIC_API_URL !== undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

/**
 * Funnel is computed from the actual application records rather than
 * hardcoded, so the numbers can't drift out of sync with the pipeline.
 */
function buildFunnel(apps: ApplicationRecord[]) {
  const reached = (stages: ApplicationRecord["status"][]) =>
    apps.filter((a) => stages.includes(a.status)).length;

  const submittedOrLater: ApplicationRecord["status"][] = [
    "submitted",
    "recruiter_contacted",
    "screening",
    "interview",
    "offer",
    "rejected",
  ];
  const screeningOrLater: ApplicationRecord["status"][] = [
    "screening",
    "interview",
    "offer",
  ];

  return [
    { label: "Discovered", value: apps.length },
    {
      label: "Qualified",
      value: apps.filter((a) => a.status !== "rejected").length,
    },
    { label: "Applied", value: reached(submittedOrLater) },
    {
      label: "Recruiter contacted",
      value: reached(["recruiter_contacted", "screening", "interview", "offer"]),
    },
    { label: "Screening", value: reached(screeningOrLater) },
    { label: "Interviews", value: reached(["interview", "offer"]) },
    { label: "Offers", value: reached(["offer"]) },
  ];
}

export default function AnalyticsPage() {
  const apps = React.useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    () => [] as ApplicationRecord[]
  );
  // A funnel of zeroes is a claim about the pipeline. Only make it when the
  // pipeline was actually read.
  const loadState = React.useSyncExternalStore(
    subscribeApplications,
    getApplicationsLoadState,
    () => "loading" as const
  );

  if (hasDataSource() && loadState === "loading") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Analytics" description="Funnel conversion and response rates." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (hasDataSource() && loadState === "error") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Analytics" description="The pipeline couldn't be loaded." />
        <EmptyState
          icon={AlertCircle}
          title="Couldn't reach the CareerOS API"
          description="Showing a funnel of zeroes here would misreport your pipeline, so nothing is shown. Start the backend on port 8000 and reload."
          className="flex-1"
        />
      </div>
    );
  }

  if (!hasDataSource()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Analytics"
          description="Funnel conversion, response rates, and observational insights across your applications."
        />

      {/* What to close next, across every role being targeted. */}
      <SkillGaps />
        <EmptyState
          icon={AlertCircle}
          title="Nothing to analyze yet"
          description="Analytics need real application outcomes to be meaningful. Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview."
          className="flex-1"
        />
      </div>
    );
  }

  const funnel = buildFunnel(apps);
  const top = funnel[0]?.value || 1;
  const avgFit = apps.length
    ? Math.round(apps.reduce((n, a) => n + a.rawFitScore, 0) / apps.length)
    : 0;
  const scored = apps.filter((a) => typeof a.resumeScore === "number");
  const avgResume = scored.length
    ? Math.round(scored.reduce((n, a) => n + (a.resumeScore ?? 0), 0) / scored.length)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Computed from your actual application records — not projections."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Applications" value={apps.length} />
        <MetricCard label="Avg fit score" value={avgFit} />
        <MetricCard label="Avg resume score" value={avgResume} />
        <MetricCard
          label="Offer rate"
          value={`${Math.round((funnel[6].value / Math.max(funnel[2].value, 1)) * 100)}%`}
          hint="of applications submitted"
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-foreground">Funnel</h2>
        <div className="space-y-2.5">
          {funnel.map((stage, i) => {
            const pct = (stage.value / top) * 100;
            const prev = i > 0 ? funnel[i - 1].value : null;
            const conversion =
              prev && prev > 0 ? Math.round((stage.value / prev) * 100) : null;
            return (
              <div key={stage.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stage.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium tabular-nums text-foreground">{stage.value}</span>
                    {conversion !== null && (
                      <span className="text-muted-foreground/70 tabular-nums">
                        {conversion}% of previous
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-6 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-primary/70 transition-all"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Lightbulb className="size-4 text-muted-foreground" strokeWidth={1.75} />
          Observations
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            Applications that reached an interview had an average fit score of{" "}
            <span className="font-medium text-foreground">
              {(() => {
                const advanced = apps.filter((a) => ["interview", "offer"].includes(a.status));
                return advanced.length
                  ? Math.round(advanced.reduce((n, a) => n + a.rawFitScore, 0) / advanced.length)
                  : "—";
              })()}
            </span>
            , versus {avgFit} across all applications. This is an observed
            association in a small sample, not evidence that a higher score causes
            more interviews.
          </li>
          <li>
            {apps.filter((a) => a.recruiterName).length} of {apps.length} applications
            have an identified recruiter contact.
          </li>
        </ul>
      </div>
    </div>
  );
}
