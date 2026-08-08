"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ScoreBadge } from "@/components/score-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { listResumes } from "@/lib/api/resumes";

const statusLabel = { draft: "Draft", ready: "Ready", approved: "Approved" } as const;

export default function ResumesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["resumes", "list"],
    queryFn: () => listResumes(),
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Resumes"
        description="Job-specific resume versions, each with a recruiter audit and evidence-backed tailoring."
      />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data?.ok === false && (
        <EmptyState
          icon={AlertCircle}
          title="Resume workspace isn't connected"
          description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          className="flex-1"
        />
      )}

      {!isLoading && data?.ok && data.data.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No tailored resumes yet"
          description="Tailor a resume from a job's detail page to see it — and its version history — here."
          className="flex-1"
        />
      )}

      {!isLoading && data?.ok && data.data.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {data.data.map((resume) => (
            <Link
              key={resume.jobId}
              href={`/resume/${resume.jobId}`}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-accent/40"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {resume.jobTitle} <span className="font-normal text-muted-foreground">@ {resume.companyName}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Version V{resume.version}</span>
                  <Badge variant="secondary" className="font-normal">
                    {statusLabel[resume.status]}
                  </Badge>
                </div>
              </div>
              <ScoreBadge score={resume.resumeScore} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
