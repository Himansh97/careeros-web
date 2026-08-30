"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Building2, MapPin, AlertCircle, UserCheck, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterviewPack } from "@/components/applications/interview-pack";
import { DefendIt } from "@/components/learn/defend-it";
import { RecordOutcome } from "@/components/applications/record-outcome";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ScoreBadge } from "@/components/score-badge";
import { MessageCard } from "@/components/recruiter-messages/message-card";
import { getApplication, advanceApplication, nextStatus } from "@/lib/api/applications";
import { listRecruiterMessages } from "@/lib/api/recruiter-messages";
import { pipelineColumns } from "@/types/application";
import { formatRelativeTime } from "@/lib/format";

const statusLabel = new Map(pipelineColumns.map((c) => [c.value, c.label]));

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["applications", "detail", params.applicationId],
    queryFn: () => getApplication(params.applicationId),
  });
  const recruiterMessagesQuery = useQuery({
    queryKey: ["recruiter-messages", params.applicationId],
    queryFn: () => listRecruiterMessages(params.applicationId),
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

  const backButton = (
    <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/applications")}>
      <ArrowLeft className="size-3.5" strokeWidth={1.75} />
      Back to Applications
    </Button>
  );

  if (!data?.ok) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        {backButton}
        <EmptyState
          icon={AlertCircle}
          title={data?.reason === "not_found" ? "Application not found" : "Applications aren't connected"}
          description={
            data?.reason === "not_found"
              ? "This application may have been removed."
              : "Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          }
          className="flex-1"
        />
      </div>
    );
  }

  const app = data.data;
  const next = nextStatus(app.status);
  const recruiterMessages = recruiterMessagesQuery.data?.ok
    ? [...recruiterMessagesQuery.data.data]
        .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))
        .slice(0, 5)
    : [];
  const recruiterMessagesFailed =
    recruiterMessagesQuery.isError || recruiterMessagesQuery.data?.ok === false;

  return (
    <div className="flex flex-1 flex-col gap-5">
      {backButton}

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Building2 className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{app.title}</h1>
              <p className="text-sm text-muted-foreground">{app.company.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" strokeWidth={1.75} />
                  {app.location}
                </span>
                <Badge variant="secondary" className="font-normal">{statusLabel.get(app.status)}</Badge>
                {app.recruiterName && (
                  <span className="inline-flex items-center gap-1">
                    <UserCheck className="size-3" strokeWidth={1.75} />
                    {app.recruiterName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <ScoreBadge score={app.rawFitScore} size="lg" />
            {typeof app.resumeScore === "number" && (
              <span className="text-xs text-muted-foreground">
                Resume <ScoreBadge score={app.resumeScore} size="sm" showLabel={false} />
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Everything the system knows about this application, in one place —
              most useful the moment a recruiter replies. */}
          <InterviewPack jobId={app.jobId} />
          {!app.outcome && <RecordOutcome applicationId={app.id} currentStatus={app.status} />}
          <Button size="sm" variant="outline" onClick={() => router.push(`/jobs/${app.jobId}`)}>
            View job
          </Button>
          {typeof app.resumeScore === "number" && (
            <Button size="sm" variant="outline" onClick={() => router.push(`/resume/${app.jobId}`)}>
              View resume
            </Button>
          )}
          {next && app.status !== "rejected" && (
            <Button
              size="sm"
              onClick={() => {
                advanceApplication(app.id);
                toast.success(`Moved to ${statusLabel.get(next)}`);
                refetch();
              }}
            >
              Advance to {statusLabel.get(next)}
              <ArrowRight className="size-3.5" strokeWidth={1.75} />
            </Button>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Next action: </span>
          {app.nextAction}
        </p>
      </div>

      {/* Directly under the application, above everything that is about waiting.
          The minute after staging is the only minute when explaining a
          requirement out loud feels like preparation rather than revision. It
          renders nothing when this posting has no requirement with material. */}
      <DefendIt jobId={app.jobId} />

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-foreground">Recruiter messages</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/recruiter-messages">View all recruiter messages</Link>
          </Button>
        </div>

        {recruiterMessagesQuery.isLoading && (
          <div className="space-y-3" aria-label="Loading recruiter messages" aria-busy="true">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-border p-4">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="mt-3 h-5 w-72 max-w-[85%]" />
                <Skeleton className="mt-4 h-4 w-full" />
              </div>
            ))}
          </div>
        )}

        {!recruiterMessagesQuery.isLoading && recruiterMessagesFailed && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2 text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
              <div>
                <p className="font-medium text-foreground">Recruiter messages unavailable</p>
                <p>Your application details are still available. Try the messages again in a moment.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => void recruiterMessagesQuery.refetch()}
            >
              <RefreshCw />
              Try again
            </Button>
          </div>
        )}

        {!recruiterMessagesQuery.isLoading && recruiterMessagesQuery.data?.ok && recruiterMessages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No recruiter replies detected for this application.
          </p>
        )}

        {!recruiterMessagesQuery.isLoading && recruiterMessages.length > 0 && (
          <div className="space-y-3">
            {recruiterMessages.map((message) => (
              <MessageCard
                key={message.gmailMessageId}
                message={message}
                company={app.company.name}
                role={app.title}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-foreground">Timeline</h2>
        <ol className="space-y-4">
          {app.timeline.map((event, i) => (
            <li key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="size-2 shrink-0 rounded-full bg-primary" />
                {i < app.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-1">
                <p className="text-sm text-foreground">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  ({formatRelativeTime(event.timestamp)})
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
