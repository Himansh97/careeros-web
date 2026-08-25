"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle, FileText, Pencil, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { RequirementsSidebar } from "@/components/resume/requirements-sidebar";
import { ResumeHeader } from "@/components/resume/resume-header";
import { ResumeSection } from "@/components/resume/resume-section";
import { ModeToggle, type DiffMode } from "@/components/resume/mode-toggle";
import { ResumeCoachPanel } from "@/components/resume/coach-panel";
import { RecruiterAuditPanel } from "@/components/resume/recruiter-audit-panel";
import {
  approveResume,
  editBullet,
  editResumeField,
  getResume,
  resetResumeEdits,
  revertBullet,
} from "@/lib/api/resumes";
import { getJob } from "@/lib/api/jobs";

function SummaryBlock({
  summary,
  edited,
  editable,
  onSave,
}: {
  summary: string;
  edited: boolean;
  editable: boolean;
  onSave: (text: string) => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(summary);
  const [saving, setSaving] = React.useState(false);

  // The draft is seeded when editing starts, not synced from a prop. The
  // generated summary differs per job, so syncing it in an effect would both
  // trigger cascading renders and let a stale draft overwrite a newer summary.
  function startEditing() {
    setText(summary);
    setEditing(true);
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-md border border-primary/40 bg-accent/30 p-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          autoFocus
          aria-label="Edit professional summary"
          className="text-sm leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <div className="flex justify-end gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={saving || !text.trim() || text.trim() === summary.trim()}
            onClick={async () => {
              setSaving(true);
              await onSave(text.trim());
              setSaving(false);
              setEditing(false);
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-md p-2">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Professional summary
        </h3>
        {edited && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            edited
          </span>
        )}
        {editable && (
          <button
            type="button"
            onClick={startEditing}
            className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Edit professional summary"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed text-foreground">{summary}</p>
    </div>
  );
}

export default function ResumeWorkspacePage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = React.useState<DiffMode>("tailored");
  const [approved, setApproved] = React.useState(false);

  const resumeQuery = useQuery({
    queryKey: ["resume", params.jobId],
    queryFn: () => getResume(params.jobId),
  });

  // Every edit path refetches rather than patching the cache. Tailoring is a
  // server-side run — an edit shifts the audit score and QA findings too, and
  // reconstructing those on the client would just be a second implementation
  // of the same logic that could drift from the real one.
  const refresh = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["resume", params.jobId] }),
    [queryClient, params.jobId]
  );

  const saveBullet = React.useCallback(
    async (claimId: string, text: string) => {
      const res = await editBullet(params.jobId, claimId, text);
      if (!res.ok) {
        toast.error("Couldn't save that edit");
        return [];
      }
      await refresh();
      if (res.data.warnings.length > 0) {
        toast.warning("Saved — but it goes beyond your evidence file", {
          description: res.data.warnings.join("; "),
        });
      } else {
        toast.success("Bullet updated");
      }
      return res.data.warnings;
    },
    [params.jobId, refresh]
  );

  const undoBullet = React.useCallback(
    async (claimId: string) => {
      const res = await revertBullet(params.jobId, claimId);
      if (!res.ok) {
        toast.error("Couldn't revert that bullet");
        return;
      }
      await refresh();
      toast.success("Reverted to the tailored wording");
    },
    [params.jobId, refresh]
  );
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
  const hasEdits =
    (resume.editedFields?.length ?? 0) > 0 ||
    resume.sections.some((s) => s.bullets.some((b) => b.editedBy === "user"));

  return (
    <div className="flex flex-1 flex-col gap-4">
      {backButton}

      <ResumeHeader
        applyUrl={jobQuery.data?.ok ? jobQuery.data.data.applyUrl : null}
        resume={isApproved ? { ...resume, status: "approved" } : resume}
        onApprove={async () => {
          // Was pure local state with a toast claiming the feature was not
          // connected. Approving now records the decision and starts the
          // recruiter research for this employer — approval is the point at
          // which a job is worth spending a provider credit on.
          const res = await approveResume(resume.jobId);
          if (!res.ok) {
            toast.error("Couldn't approve", {
              description:
                res.reason === "not_connected"
                  ? "The CareerOS API isn't reachable — start it on port 8000."
                  : "The backend rejected it.",
            });
            return;
          }
          setApproved(true);
          await queryClient.invalidateQueries({ queryKey: ["outreach"] });
          await queryClient.invalidateQueries({ queryKey: ["approvals"] });

          const o = res.data.outreach;
          toast.success("Resume approved", {
            description: o.drafted
              ? "Recruiter found and both messages drafted. Nothing was sent."
              : o.detail ?? "Nothing else was changed.",
            action: o.drafted
              ? { label: "Open outreach", onClick: () => router.push("/outreach") }
              : undefined,
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
            <div className="flex items-center gap-2">
              {hasEdits && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const res = await resetResumeEdits(params.jobId);
                    if (!res.ok) {
                      toast.error("Couldn't undo your edits");
                      return;
                    }
                    await refresh();
                    toast.success("Your edits were undone", {
                      description: "The tailored resume is unchanged.",
                    });
                  }}
                >
                  <RotateCcw className="size-3.5" strokeWidth={1.75} />
                  Undo my edits
                </Button>
              )}
              <ResumeCoachPanel jobId={params.jobId} onApplied={refresh} />
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
          </div>

          {resume.summary && (
            <SummaryBlock
              summary={resume.summary}
              edited={resume.editedFields?.includes("summary") ?? false}
              editable={mode === "tailored"}
              onSave={async (text) => {
                const res = await editResumeField(params.jobId, "summary", text);
                if (!res.ok) {
                  toast.error("Couldn't save the summary");
                  return;
                }
                await refresh();
                toast.success("Summary updated");
              }}
            />
          )}

          <div className="space-y-5">
            {resume.sections.map((section) => (
              <ResumeSection
                key={section.id}
                section={section}
                mode={mode}
                onSaveBullet={saveBullet}
                onRevertBullet={undoBullet}
              />
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
