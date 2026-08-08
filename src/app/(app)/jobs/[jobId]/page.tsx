"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  FileText,
  Send,
  Bookmark,
  X,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/score-badge";
import { MatchBreakdown } from "@/components/match-breakdown";
import { RequirementMatrix } from "@/components/requirement-matrix";
import { EmptyState } from "@/components/empty-state";
import { getJob } from "@/lib/api/jobs";
import { formatRelativeTime, formatSalary } from "@/lib/format";

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "detail", params.jobId],
    queryFn: () => getJob(params.jobId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/jobs")}>
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Back to Discover Jobs
        </Button>
        <EmptyState
          icon={AlertCircle}
          title={data?.reason === "not_found" ? "Job not found" : "Job discovery isn't connected"}
          description={
            data?.reason === "not_found"
              ? "This job may have been removed or the link is out of date."
              : "Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview job detail pages with mock data."
          }
          className="flex-1"
        />
      </div>
    );
  }

  const job = data.data;
  const salary = formatSalary(job.salary);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/jobs")}>
        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
        Back to Discover Jobs
      </Button>

      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Building2 className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{job.title}</h1>
              <p className="text-sm text-muted-foreground">{job.company.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" strokeWidth={1.75} />
                  {job.location}
                </span>
                {salary && <span>{salary}</span>}
                {job.postedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" strokeWidth={1.75} />
                    Posted {formatRelativeTime(job.postedAt)}
                  </span>
                )}
                <Badge variant="secondary" className="font-normal">{job.source}</Badge>
                {job.atsPlatform && (
                  <Badge variant="secondary" className="font-normal">{job.atsPlatform}</Badge>
                )}
              </div>
            </div>
          </div>
          {typeof job.rawFitScore === "number" && <ScoreBadge score={job.rawFitScore} size="lg" />}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              toast.info("Resume tailoring isn't connected yet — this will generate a job-specific resume version once wired up.")
            }
          >
            <FileText className="size-3.5" strokeWidth={1.75} />
            Tailor Resume
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.info("Application prep isn't connected yet — this will fill and stage the application for your review.")
            }
          >
            <Send className="size-3.5" strokeWidth={1.75} />
            Prepare Application
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success(job.saved ? "Removed from saved" : "Job saved")}
          >
            <Bookmark className="size-3.5" strokeWidth={1.75} fill={job.saved ? "currentColor" : "none"} />
            {job.saved ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              toast("Job dismissed");
              router.push("/jobs");
            }}
          >
            <X className="size-3.5" strokeWidth={1.75} />
            Dismiss
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="match">Match Analysis</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="recruiter">Recruiter</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-medium text-foreground">Description</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </div>
          {job.strongMatches && job.strongMatches.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-medium text-foreground">Why this matches</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.strongMatches.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                ))}
              </div>
              {job.gaps && job.gaps.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">Gap: {job.gaps.join(", ")}</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="match" className="space-y-4">
          {job.matchBreakdown && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl font-semibold tabular-nums text-foreground">
                  {job.matchBreakdown.overall}
                </span>
                <ScoreBadge score={job.matchBreakdown.overall} size="md" />
              </div>
              <MatchBreakdown breakdown={job.matchBreakdown} />
            </div>
          )}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">Requirement matrix</h3>
            <RequirementMatrix requirements={job.requirements} />
          </div>
        </TabsContent>

        <TabsContent value="resume">
          <EmptyState
            icon={FileText}
            title="No tailored resume yet"
            description="Click Tailor Resume above to generate a job-specific version once resume tailoring is connected."
          />
        </TabsContent>

        <TabsContent value="application">
          <EmptyState
            icon={Send}
            title="Application not started"
            description="Prepare Application will walk through eligibility, form fields, and a final review before anything is submitted."
          />
        </TabsContent>

        <TabsContent value="recruiter">
          <EmptyState
            icon={job.recruiterStatus === "found" ? UserCheck : UserX}
            title={job.recruiterStatus === "found" ? "Recruiter found (preview)" : "No recruiter identified"}
            description={
              job.recruiterStatus === "found"
                ? "Recruiter research isn't connected yet — a real name, confidence score, and outreach drafts will appear here once it is."
                : "Recruiter research runs once an application is ready to prepare."
            }
          />
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-lg border border-border bg-card p-4">
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  {formatRelativeTime(job.discoveredAt)} — CareerOS discovered this role via {job.source}.
                </span>
              </li>
            </ol>
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        <Link href={job.applyUrl} target="_blank" className="underline hover:text-foreground">
          View original posting ↗
        </Link>
      </p>
    </div>
  );
}
