"use client";

import * as React from "react";
import { toast } from "sonner";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import { JobCard } from "@/components/job-card";
import { searchJobs } from "@/lib/api/jobs";
import { subscribeApplications, getApplicationsSnapshot } from "@/lib/api/applications";
import { subscribeApprovals, getApprovalsSnapshot } from "@/lib/api/approvals";
import type { ApplicationRecord } from "@/types/application";
import type { ApprovalItem } from "@/types/approval";

export default function DashboardPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "search", "dashboard"],
    queryFn: () => searchJobs({}),
  });

  const applications = React.useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    () => [] as ApplicationRecord[]
  );
  const approvals = React.useSyncExternalStore(
    subscribeApprovals,
    getApprovalsSnapshot,
    () => [] as ApprovalItem[]
  );

  const jobs = data?.ok ? data.data.jobs : [];
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
        title="Good morning, Himanshu"
        description={
          jobs.length > 0
            ? `${jobs.length} opportunities in view · ${pendingApprovals} item${pendingApprovals === 1 ? "" : "s"} need your approval.`
            : "No searches have been run yet — connect job discovery to start finding opportunities."
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/approvals")}>
              Review Matches
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info(
                  "Autopilot isn't connected yet — it'll run discovery, scoring, and tailoring automatically once wired up."
                )
              }
            >
              <Bot className="size-3.5" strokeWidth={1.75} />
              Run Autopilot
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} icon={m.icon} />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="relative inline-flex size-2 rounded-full bg-muted-foreground/50" />
            </span>
            <span className="text-sm font-medium text-foreground">Autopilot</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Idle
            </span>
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
          <div className="space-y-2">
            {topOpportunities.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={(j) => router.push(`/jobs/${j.id}`)}
                onToggleSave={() => toast.success("Job saved")}
                onDismiss={() => toast("Job dismissed")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
