"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  approveRecruiterDraft,
  dismissRecruiterDraft,
  retryRecruiterDraft,
  updateRecruiterDraft,
} from "@/lib/api/recruiter-messages";
import { cn } from "@/lib/utils";
import type { ApiResult } from "@/lib/api/client";
import type {
  RecruiterDraftPatch,
  RecruiterDraftStatus,
  RecruiterMessage,
} from "@/types/recruiter-message";

interface DraftReviewProps {
  message: RecruiterMessage;
  onRefetch: () => Promise<unknown>;
}

type DraftAction = "save" | "approve" | "dismiss" | "retry";

const statusDetails: Record<
  RecruiterDraftStatus,
  { label: string; description: string; className: string; icon: typeof ShieldCheck }
> = {
  awaiting_approval: {
    label: "Awaiting approval",
    description: "Review every field. Nothing goes to Gmail until you explicitly approve this draft.",
    className: "border-warning/30 bg-warning/10 text-warning",
    icon: ShieldCheck,
  },
  approved: {
    label: "Approved",
    description: "Approved for draft creation. No email has been sent.",
    className: "border-info/30 bg-info/10 text-info",
    icon: FileCheck2,
  },
  creating: {
    label: "Creating draft",
    description: "CareerOS is creating an unsent draft in Gmail. No email has been sent.",
    className: "border-info/30 bg-info/10 text-info",
    icon: LoaderCircle,
  },
  created: {
    label: "Gmail draft ready",
    description: "The unsent Gmail draft is ready for your final review in Gmail.",
    className: "border-success/30 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  dismissed: {
    label: "Dismissed",
    description: "This suggested reply was dismissed. No Gmail draft was created.",
    className: "border-border bg-muted/60 text-muted-foreground",
    icon: XCircle,
  },
  failed: {
    label: "Draft creation failed",
    description: "Review the draft and try the creation step again when you're ready.",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
};

function parseRecipients(value: string) {
  return value
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

function resultOrThrow<T>(result: ApiResult<T>, fallback: string): T {
  if (result.ok) return result.data;
  if (result.reason === "not_connected") {
    throw new Error("CareerOS API isn't connected. Your changes were not saved.");
  }
  throw new Error(result.message ? `${fallback} (${result.message})` : fallback);
}

export function DraftReview({ message, onRefetch }: DraftReviewProps) {
  const draft = message.draft;
  const fieldPrefix = React.useId();
  const [to, setTo] = React.useState(() => draft?.to.join(", ") ?? "");
  const [cc, setCc] = React.useState(() => draft?.cc.join(", ") ?? "");
  const [bcc, setBcc] = React.useState(() => draft?.bcc.join(", ") ?? "");
  const [subject, setSubject] = React.useState(() => draft?.subject ?? "");
  const [body, setBody] = React.useState(() => draft?.body ?? "");
  const [approvalOpen, setApprovalOpen] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const payload: RecruiterDraftPatch = {
    to: parseRecipients(to),
    cc: parseRecipients(cc),
    bcc: parseRecipients(bcc),
    subject,
    body,
  };

  const mutation = useMutation({
    mutationFn: async (action: DraftAction) => {
      if (action === "save") {
        return resultOrThrow(
          await updateRecruiterDraft(message.gmailMessageId, payload),
          "The draft could not be saved."
        );
      }

      if (action === "approve") {
        resultOrThrow(
          await updateRecruiterDraft(message.gmailMessageId, payload),
          "The reviewed draft could not be saved."
        );
        return resultOrThrow(
          await approveRecruiterDraft(message.gmailMessageId),
          "The Gmail draft could not be approved."
        );
      }

      if (action === "retry") {
        resultOrThrow(
          await updateRecruiterDraft(message.gmailMessageId, payload),
          "The reviewed draft could not be saved."
        );
        return resultOrThrow(
          await retryRecruiterDraft(message.gmailMessageId),
          "Draft creation could not be retried."
        );
      }

      return resultOrThrow(
        await dismissRecruiterDraft(message.gmailMessageId),
        "The draft could not be dismissed."
      );
    },
    onSuccess: (_result, action) => {
      if (action === "save") toast.success("Draft changes saved");
      if (action === "approve") {
        setApprovalOpen(false);
        toast.success("Gmail draft approved", {
          description: "It is queued as an unsent draft. No email was sent.",
        });
      }
      if (action === "retry") {
        toast.success("Draft creation queued again", {
          description: "No email was sent.",
        });
      }
      if (action === "dismiss") toast("Draft dismissed");
    },
    onError: (error) => {
      toast.error("Draft action didn't complete", { description: error.message });
    },
    onSettled: async () => {
      await onRefetch();
    },
  });

  if (!draft) {
    return (
      <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No suggested reply is available</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You can still open the original message in Gmail.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <a href={message.gmailUrl} target="_blank" rel="noreferrer">
            <ExternalLink />
            Open original in Gmail
          </a>
        </Button>
      </div>
    );
  }

  const status = statusDetails[draft.status];
  const StatusIcon = status.icon;
  const isEditable = draft.status === "awaiting_approval" || draft.status === "failed";
  const isDirty =
    to !== draft.to.join(", ") ||
    cc !== draft.cc.join(", ") ||
    bcc !== draft.bcc.join(", ") ||
    subject !== draft.subject ||
    body !== draft.body;
  const visibleError = formError ?? mutation.error?.message ?? null;

  function clearError() {
    setFormError(null);
    mutation.reset();
  }

  function hasCompleteDraft() {
    if (payload.to && payload.to.length > 0 && subject.trim() && body.trim()) return true;
    setFormError("Add at least one To recipient, a subject, and a complete body before continuing.");
    return false;
  }

  function requestApproval() {
    clearError();
    if (hasCompleteDraft()) setApprovalOpen(true);
  }

  function retryDraft() {
    clearError();
    if (hasCompleteDraft()) mutation.mutate("retry");
  }

  const gmailDraftUrl = draft.gmailDraftId
    ? `https://mail.google.com/mail/u/0/#drafts/${encodeURIComponent(draft.gmailDraftId)}`
    : null;

  return (
    <section className="space-y-5" aria-labelledby={`${fieldPrefix}-heading`}>
      <div className={cn("flex items-start gap-3 rounded-xl border p-4", status.className)}>
        <StatusIcon
          className={cn("mt-0.5 size-5 shrink-0", draft.status === "creating" && "animate-spin")}
          strokeWidth={1.8}
        />
        <div className="min-w-0">
          <div className="font-medium">{status.label}</div>
          <p className="mt-0.5 text-sm opacity-80">{status.description}</p>
          {draft.status === "failed" && draft.lastErrorMessage && (
            <p className="mt-2 text-sm font-medium">{draft.lastErrorMessage}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id={`${fieldPrefix}-heading`} className="text-base font-semibold text-foreground">
              Suggested reply
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditable
                ? "Make it sound like you, then review the exact draft before approval."
                : "These are the fields recorded for this draft."}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {isEditable ? (isDirty ? "Unsaved changes" : "All changes saved") : "Read only"}
          </Badge>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor={`${fieldPrefix}-to`} className="text-sm font-medium text-foreground">
                To
              </label>
              <Input
                id={`${fieldPrefix}-to`}
                value={to}
                disabled={!isEditable || mutation.isPending}
                onChange={(event) => {
                  clearError();
                  setTo(event.target.value);
                }}
                placeholder="name@example.com, teammate@example.com"
                aria-describedby={`${fieldPrefix}-recipient-help`}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${fieldPrefix}-cc`} className="text-sm font-medium text-foreground">
                CC
              </label>
              <Input
                id={`${fieldPrefix}-cc`}
                value={cc}
                disabled={!isEditable || mutation.isPending}
                onChange={(event) => {
                  clearError();
                  setCc(event.target.value);
                }}
                placeholder="Optional"
                aria-describedby={`${fieldPrefix}-recipient-help`}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${fieldPrefix}-bcc`} className="text-sm font-medium text-foreground">
                BCC
              </label>
              <Input
                id={`${fieldPrefix}-bcc`}
                value={bcc}
                disabled={!isEditable || mutation.isPending}
                onChange={(event) => {
                  clearError();
                  setBcc(event.target.value);
                }}
                placeholder="Optional"
                aria-describedby={`${fieldPrefix}-recipient-help`}
              />
            </div>
          </div>
          <p id={`${fieldPrefix}-recipient-help`} className="text-xs text-muted-foreground">
            Separate multiple addresses with commas.
          </p>

          <div className="space-y-1.5">
            <label htmlFor={`${fieldPrefix}-subject`} className="text-sm font-medium text-foreground">
              Subject
            </label>
            <Input
              id={`${fieldPrefix}-subject`}
              value={subject}
              disabled={!isEditable || mutation.isPending}
              onChange={(event) => {
                clearError();
                setSubject(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${fieldPrefix}-body`} className="text-sm font-medium text-foreground">
              Body
            </label>
            <Textarea
              id={`${fieldPrefix}-body`}
              value={body}
              disabled={!isEditable || mutation.isPending}
              onChange={(event) => {
                clearError();
                setBody(event.target.value);
              }}
              className="min-h-64 resize-y leading-relaxed"
            />
          </div>
        </div>

        {visibleError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
            <span>{visibleError}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild variant="outline">
            <a href={message.gmailUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
              Open original in Gmail
            </a>
          </Button>

          {gmailDraftUrl && draft.status === "created" && (
            <Button asChild>
              <a href={gmailDraftUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                Open Gmail draft
              </a>
            </Button>
          )}

          {isEditable && (
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => mutation.mutate("save")}
                disabled={!isDirty || mutation.isPending}
                aria-busy={mutation.isPending && mutation.variables === "save"}
              >
                {mutation.isPending && mutation.variables === "save" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Save />
                )}
                Save changes
              </Button>
              <Button
                variant="destructive"
                onClick={() => mutation.mutate("dismiss")}
                disabled={mutation.isPending}
                aria-busy={mutation.isPending && mutation.variables === "dismiss"}
              >
                {mutation.isPending && mutation.variables === "dismiss" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <XCircle />
                )}
                Dismiss
              </Button>
              {draft.status === "failed" ? (
                <Button
                  onClick={retryDraft}
                  disabled={mutation.isPending}
                  aria-busy={mutation.isPending && mutation.variables === "retry"}
                >
                  {mutation.isPending && mutation.variables === "retry" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <RotateCcw />
                  )}
                  Retry
                </Button>
              ) : (
                <Button onClick={requestApproval} disabled={mutation.isPending}>
                  <ShieldCheck />
                  Approve Gmail draft
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={approvalOpen}
        onOpenChange={(open) => {
          if (!mutation.isPending) setApprovalOpen(open);
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-hidden p-0 sm:max-w-2xl" showCloseButton={!mutation.isPending}>
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>Review the exact Gmail draft</DialogTitle>
            <DialogDescription>
              This creates an unsent Gmail draft. It does not send email.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-2 sm:px-6">
            <dl className="grid gap-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[4rem_1fr]">
                <dt className="font-medium text-muted-foreground">To</dt>
                <dd className="break-words text-foreground">{payload.to?.join(", ")}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[4rem_1fr]">
                <dt className="font-medium text-muted-foreground">CC</dt>
                <dd className="break-words text-foreground">{payload.cc?.join(", ") || "None"}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[4rem_1fr]">
                <dt className="font-medium text-muted-foreground">BCC</dt>
                <dd className="break-words text-foreground">{payload.bcc?.join(", ") || "None"}</dd>
              </div>
              <div className="grid gap-1 border-t border-border pt-3 sm:grid-cols-[4rem_1fr]">
                <dt className="font-medium text-muted-foreground">Subject</dt>
                <dd className="break-words font-medium text-foreground">{subject}</dd>
              </div>
            </dl>

            <div>
              <div className="mb-1.5 text-sm font-medium text-muted-foreground">Complete body</div>
              <div className="whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                {body}
              </div>
            </div>

            {mutation.error && (
              <div role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {mutation.error.message}
              </div>
            )}
          </div>

          <DialogFooter className="m-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={mutation.isPending}>
                Keep editing
              </Button>
            </DialogClose>
            <Button
              onClick={() => mutation.mutate("approve")}
              disabled={mutation.isPending}
              aria-busy={mutation.isPending && mutation.variables === "approve"}
            >
              {mutation.isPending && mutation.variables === "approve" ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ShieldCheck />
              )}
              Approve Gmail draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
