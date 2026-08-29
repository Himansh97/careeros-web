"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Search,
  Briefcase,
  FileCheck2,
  Send,
  MessageSquareReply,
  CalendarCheck2,
  Bot,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import { JobCard } from "@/components/job-card";
import { AlertsBanner } from "@/components/alerts-banner";
import { DailyApplicationCounter } from "@/components/applications/daily-application-counter";
import { RoundStrip } from "@/components/round/round-strip";
import { DeadlineCountdownCard } from "@/components/deadline-countdown";
import { MotionList, MotionListItem, Stagger } from "@/components/motion/primitives";
import { searchJobs } from "@/lib/api/jobs";
import { getProfile } from "@/lib/api/profile";
import { readDeadlineConfig } from "@/lib/deadline-countdown";
import { useAutopilot } from "@/lib/hooks/use-autopilot";
import { useJobFlags } from "@/lib/hooks/use-job-flags";
import { formatRelativeTime } from "@/lib/format";
import { subscribeApplications, getApplicationsSnapshot,
  getApplicationsServerSnapshot } from "@/lib/api/applications";
import { subscribeApprovals, getApprovalsSnapshot,
  getApprovalsServerSnapshot } from "@/lib/api/approvals";

/** "Good morning" was hardcoded, so it greeted the user that way at midnight. */
function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { run: runAutopilot, running, busy: autopilotBusy, lastRunAt } = useAutopilot();
  const { toggleSave, dismiss } = useJobFlags();

  // Same key as the jobs page: this is the identical unfiltered search, and
  // under its own key it ran the whole ~7,400-job pipeline a second time.
  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "search", {}],
    queryFn: () => searchJobs({}),
  });

  // The deadline lives in job_preferences.yaml, which the API already serves
  // as part of the profile. Long stale time: a date the candidate set by hand
  // does not need re-fetching while they read the page.
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60_000,
  });
  const deadline = readDeadlineConfig(profile?.ok ? profile.data.preferences : null);

  const applications = React.useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    getApplicationsServerSnapshot
  );
  const approvals = React.useSyncExternalStore(
    subscribeApprovals,
    getApprovalsSnapshot,
    getApprovalsServerSnapshot
  );

  const notConnected = data?.ok === false && data.reason === "not_connected";
  const jobs = (data?.ok ? data.data.jobs : []).filter((j) => !j.dismissed);
  const strongMatches = jobs.filter((j) => (j.rawFitScore ?? 0) >= 80).length;
  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const replies = applications.filter((a) => a.recruiterStatus === "replied").length;
  const submitted = applications.filter((a) => !!a.submittedAt).length;

  const topOpportunities = [...jobs]
    .sort((a, b) => (b.rawFitScore ?? 0) - (a.rawFitScore ?? 0))
    .slice(0, 4);

  const metrics = [
    { label: "New jobs", value: jobs.length, icon: Search },
    { label: "Strong matches", value: strongMatches, icon: Sparkles },
    { label: "Needs approval", value: pendingApprovals, icon: FileCheck2 },
    { label: "Submitted", value: submitted, icon: Send },
    { label: "Recruiter replies", value: replies, icon: MessageSquareReply },
    { label: "Interviews", value: interviews, icon: CalendarCheck2 },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={`${greeting(new Date().getHours())}, Himanshu`}
        description={
          notConnected
            ? "No data source is connected — nothing below reflects real opportunities or applications."
            : jobs.length > 0
              ? `${jobs.length} opportunities in view · ${pendingApprovals} item${pendingApprovals === 1 ? "" : "s"} need your approval.`
              : "No searches have been run yet — connect job discovery to start finding opportunities."
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/approvals")}>
              Review Matches
            </Button>
            <Button size="sm" onClick={() => void runAutopilot()} disabled={running}>
              {running ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <Bot className="size-3.5" strokeWidth={1.75} />
              )}
              {running ? "Running…" : "Run Autopilot"}
            </Button>
          </div>
        }
      />

      {/* Outstanding work, above the metrics: a count of what is going well
          matters less than the thing that has been sitting unsent for days. */}
      <AlertsBanner />

      {/* Above the daily counter deliberately: the daily goal is a pace, and a
          pace only means something against the time left to keep it. */}
      <DeadlineCountdownCard config={deadline} />

      <DailyApplicationCounter applications={applications} />

      {/* The daily round lives here rather than only at /prep/round: a challenge
          you have to remember to open is one you stop opening. */}
      <RoundStrip />

      {/* Staggered so the row reads left-to-right as it lands rather than
          appearing all at once — the same order you read it in. Capped inside
          Stagger, so it stays response rather than lag. */}
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} icon={m.icon} />
        ))}
      </Stagger>

      {/* This pill read "Idle" unconditionally, including mid-run. It now
          reflects GET /api/automation. */}
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              {autopilotBusy && (
                <span className="absolute inline-flex size-2 animate-ping rounded-full bg-success/70" />
              )}
              <span
                className={`relative inline-flex size-2 rounded-full ${
                  autopilotBusy ? "bg-success" : "bg-muted-foreground/50"
                }`}
              />
            </span>
            <span className="text-sm font-medium text-foreground">Autopilot</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {autopilotBusy ? "Running" : "Idle"}
            </span>
            {lastRunAt && !autopilotBusy && (
              <span className="text-xs text-muted-foreground">
                last run {formatRelativeTime(lastRunAt)}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/automations")}>
            Configure
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Top Opportunities</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/jobs")}>
            View all
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : notConnected ? (
          <EmptyState
            icon={AlertCircle}
            title="No data source connected"
            description="Job discovery has no backend to call. Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview with mock data, or connect a real search provider."
          />
        ) : topOpportunities.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No matches yet"
            description="CareerOS hasn't found a role above your fit threshold. Run a search to start discovering opportunities."
            action={
              <Button size="sm" onClick={() => router.push("/jobs")}>
                Discover Jobs
              </Button>
            }
          />
        ) : (
          // Dismissing from here removes the row; the exit is what tells you
          // the dismiss landed rather than the list having re-fetched.
          <MotionList className="space-y-2">
            {topOpportunities.map((job) => (
              <MotionListItem key={job.id} layoutId={`dash-${job.id}`}>
                <JobCard
                  job={job}
                  onSelect={(j) => router.push(`/jobs/${j.id}`)}
                  onToggleSave={() => void toggleSave(job)}
                  onDismiss={() => void dismiss(job)}
                />
              </MotionListItem>
            ))}
          </MotionList>
        )}
      </div>
    </div>
  );
}
