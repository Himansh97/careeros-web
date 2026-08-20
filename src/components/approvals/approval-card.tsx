"use client";

import { markApplicationOpened } from "@/lib/api/applications";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  FileDown,
  Send,
  MessageSquareText,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { CommitBoard } from "@/components/approvals/commit-board";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveItem, rejectItem, answerQuestion } from "@/lib/api/approvals";
import { API_URL, isLiveApi } from "@/lib/api/client";
import type { ApprovalItem } from "@/types/approval";

const kindConfig: Record<ApprovalItem["kind"], { icon: typeof Send; label: string }> = {
  application: { icon: Send, label: "Application" },
  outreach: { icon: MessageSquareText, label: "Outreach" },
  question: { icon: HelpCircle, label: "Question" },
  sensitive: { icon: AlertTriangle, label: "Sensitive" },
};

export function ApprovalCard({ item }: { item: ApprovalItem }) {
  const router = useRouter();
  const [answerOpen, setAnswerOpen] = React.useState(false);
  const [answer, setAnswer] = React.useState("");
  const Icon = kindConfig[item.kind].icon;
  const applyUrl = (item as { applyUrl?: string }).applyUrl;

  function downloadResume(fmt: "pdf" | "docx") {
    const a = document.createElement("a");
    a.href = `${API_URL}/api/jobs/${encodeURIComponent(item.jobId)}/resume.${fmt}`;
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const resolved = item.status !== "pending";

  function handleApprove() {
    approveItem(item.id);
    toast.success(
      item.kind === "application"
        ? "Marked as applied"
        : "Approved",
      {
        description:
          item.kind === "application"
            ? "CareerOS does not submit applications — this records that you did."
            : undefined,
      }
    );
  }

  function handleReject() {
    rejectItem(item.id);
    toast("Rejected");
  }

  function handleSubmitAnswer() {
    if (!answer.trim()) return;
    answerQuestion(item.id);
    setAnswerOpen(false);
    toast.success("Answer recorded", {
      description: "This application can proceed now that the question is answered.",
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {kindConfig[item.kind].label}
              </Badge>
              {resolved && (
                <Badge
                  variant="outline"
                  className={
                    item.status === "approved" || item.status === "answered"
                      ? "border-primary/30 text-primary"
                      : "border-destructive/30 text-destructive"
                  }
                >
                  {item.status}
                </Badge>
              )}
            </div>
            <h3 className="mt-1 text-sm font-medium text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground">
              {item.jobTitle} · {item.companyName}
            </p>
          </div>
        </div>

        {(typeof item.rawFitScore === "number" || typeof item.resumeScore === "number") && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {typeof item.rawFitScore === "number" && (
              <span className="text-xs text-muted-foreground">
                Fit <ScoreBadge score={item.rawFitScore} size="sm" showLabel={false} />
              </span>
            )}
            {typeof item.resumeScore === "number" && (
              <span className="text-xs text-muted-foreground">
                Resume <ScoreBadge score={item.resumeScore} size="sm" showLabel={false} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* The criteria before the prose. What holds this one is the thing the
          decision turns on; the description is context. */}
      {item.criteria && item.commit && (
        <CommitBoard criteria={item.criteria} commit={item.commit} />
      )}

      <div className="mt-3 space-y-2 text-sm">
        <p className="text-foreground/80">{item.whatCareerOSWantsToDo}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Why approval is required: </span>
          {item.whyApprovalRequired}
        </p>
        {item.question && (
          <div className="rounded-md border border-border bg-muted/50 p-2.5 text-sm italic text-foreground">
            &ldquo;{item.question}&rdquo;
          </div>
        )}
        {item.dataToSubmit && item.dataToSubmit.length > 0 && (
          <div>
            <span className="text-xs font-medium text-foreground/70">Data to be submitted</span>
            <ul className="mt-1 space-y-0.5">
              {item.dataToSubmit.map((d, i) => (
                <li key={i} className="text-xs text-muted-foreground">— {d}</li>
              ))}
            </ul>
          </div>
        )}
        {typeof item.riskConfidence === "number" && (
          <p className="text-xs text-muted-foreground">
            Confidence: <span className="font-medium text-foreground">{item.riskConfidence}%</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!resolved && item.kind === "question" ? (
          <Dialog open={answerOpen} onOpenChange={setAnswerOpen}>
            <Button size="sm" onClick={() => setAnswerOpen(true)}>
              Answer Question
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{item.question}</DialogTitle>
                <DialogDescription>
                  For {item.jobTitle} at {item.companyName}. This answer is used for this application only.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                rows={3}
              />
              <DialogFooter>
                <Button onClick={handleSubmitAnswer} disabled={!answer.trim()}>
                  Submit Answer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : !resolved ? (
          <>
            {isLiveApi() && (
              <Button size="sm" variant="outline" onClick={() => downloadResume("pdf")}>
                <FileDown className="size-3.5" strokeWidth={1.75} />
                Resume PDF
              </Button>
            )}
            {applyUrl && (
              // The actual application happens on the employer's own site.
              // Nothing here submits on the candidate's behalf.
              <Button size="sm" asChild>
                <a
                  href={applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => markApplicationOpened(`app_${item.jobId}`)}
                >
                  <ExternalLink className="size-3.5" strokeWidth={1.75} />
                  Open application
                </a>
              </Button>
            )}
            <Button size="sm" variant={applyUrl ? "outline" : "default"} onClick={handleApprove}>
              <CheckCircle2 className="size-3.5" strokeWidth={1.75} />
              {item.kind === "application" ? "Mark as applied" : "Approve"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push(`/jobs/${item.jobId}`)}>
              Review
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReject}>
              <XCircle className="size-3.5" strokeWidth={1.75} />
              Reject
            </Button>
          </>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          onClick={() => router.push(`/jobs/${item.jobId}`)}
        >
          Open Full Context
          <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
