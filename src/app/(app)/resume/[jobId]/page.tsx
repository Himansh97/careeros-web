"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { RequirementsSidebar } from "@/components/resume/requirements-sidebar";
import { ResumeHeader } from "@/components/resume/resume-header";
import { ResumeSection } from "@/components/resume/resume-section";
import { ModeToggle, type DiffMode } from "@/components/resume/mode-toggle";
import { RecruiterAuditPanel } from "@/components/resume/recruiter-audit-panel";
import { getResume } from "@/lib/api/resumes";
import { getJob } from "@/lib/api/jobs";

export default function ResumeWorkspacePage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const [mode, setMode] = React.useState<DiffMode>("tailored");
  const [approved, setApproved] = React.useState(false);

  const resumeQuery = useQuery({
    queryKey: ["resume", params.jobId],
    queryFn: () => getResume(params.jobId),
  });
  const jobQuery = useQuery({
    queryKey: ["jobs", "detail", params.jobId],
    queryFn: () => getJob(params.jobId),
  });

  const isLoading = resumeQuery.isLoading || jobQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[240px_1fr_280px]">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const backButton = (
    <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(`/jobs/${params.jobId}`)}>
      <ArrowLeft className="size-3.5" strokeWidth={1.75} />
      Back to job
    </Button>
  );

  if (!resumeQuery.data?.ok) {
    const reason = resumeQuery.data?.reason;
    return (
      <div className="flex flex-1 flex-col gap-4">
        {backButton}
        <EmptyState
          icon={reason === "not_found" ? FileText : AlertCircle}
          title={reason === "not_found" ? "Not tailored yet" : "Resume workspace isn't connected"}
          description={
            reason === "not_found"
              ? "This job hasn't been through resume tailoring yet. Tailor a resume from the job's detail page to see it here."
              : "Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview the resume workspace with mock data."
          }
          action={
            reason === "not_found" ? (
              <Button size="sm" onClick={() => router.push(`/jobs/${params.jobId}`)}>
                Go to job
              </Button>
            ) : undefined
          }
          className="flex-1"
        />
      </div>
    );
  }

  const resume = resumeQuery.data.data;
  const job = jobQuery.data?.ok ? jobQuery.data.data : null;
  const isApproved = approved || resume.status === "approved";

  return (
    <div className="flex flex-1 flex-col gap-4">
      {backButton}

      <ResumeHeader
        resume={isApproved ? { ...resume, status: "approved" } : resume}
        onApprove={() => {
          setApproved(true);
          toast.success("Resume approved", {
            description: "It's ready to use once application prep is connected.",
          });
        }}
      />

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[240px_1fr_280px]">
        <div className="order-2 lg:order-1">
          {job ? (
            <RequirementsSidebar requirements={job.requirements} />
          ) : (
            <EmptyState
              icon={AlertCircle}
              title="Job details unavailable"
              description="Requirement matrix needs the source job, which couldn't be loaded."
            />
          )}
        </div>

        <div className="order-1 space-y-5 rounded-lg border border-border bg-card p-4 lg:order-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Resume</h2>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <div className="space-y-5">
            {resume.sections.map((section) => (
              <ResumeSection key={section.id} section={section} mode={mode} />
            ))}
          </div>
        </div>

        <div className="order-3">
          <RecruiterAuditPanel audit={resume.audit} />
        </div>
      </div>
    </div>
  );
}
