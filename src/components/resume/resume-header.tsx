"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  FileDown,
  FileText,
  CheckCircle2,
  ExternalLink,
  Wand2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreAssay } from "@/components/score-assay";
import { API_URL, apiFetch, isLiveApi } from "@/lib/api/client";
import { ResumePreview } from "@/components/resume/resume-preview";
import type { ResumeVersion } from "@/types/resume";

const statusLabel: Record<ResumeVersion["status"], string> = {
  draft: "Draft",
  ready: "Ready",
  approved: "Approved",
};

interface ResumeHeaderProps {
  resume: ResumeVersion;
  onApprove: () => void;
  /** Employer's own application URL, when the posting carries one. */
  applyUrl?: string | null;
}

export function ResumeHeader({ resume, onApprove, applyUrl }: ResumeHeaderProps) {
  const [prefilling, setPrefilling] = React.useState(false);

  /**
   * Open the real form with the answers already filled in.
   *
   * The backend drives a visible browser and is structurally unable to press a
   * submit control, so this stops one click short of applying — deliberately.
   * It only works when the API is on this machine, since it opens a window here.
   */
  async function openPrefilled() {
    if (!isLiveApi()) {
      toast.info("Pre-fill needs the CareerOS API running locally.");
      return;
    }
    setPrefilling(true);
    const res = await apiFetch<{ filled?: number; note?: string }>(
      `/api/jobs/${encodeURIComponent(resume.jobId)}/prefill`,
      { method: "POST" }
    );
    setPrefilling(false);

    if (!res.ok) {
      toast.error("Could not open the pre-filled form", {
        description: res.message ?? "The API may not be running locally.",
      });
      return;
    }
    toast.success("Form opened and filled", {
      description:
        res.data.note ?? "Review every answer, then submit it yourself.",
    });
  }

  function download(fmt: "pdf" | "docx") {
    if (!isLiveApi()) {
      toast.info("Export needs the CareerOS API running.");
      return;
    }
    // The API sets Content-Disposition, so an anchor click downloads the file
    // with the right filename without buffering it in memory here.
    // `download=1` is required: PDFs are served inline by default so the
    // preview can render one in an iframe, and without the flag this button
    // would open the file rather than save it.
    const a = document.createElement("a");
    a.href = `${API_URL}/api/jobs/${encodeURIComponent(resume.jobId)}/resume.${fmt}?download=1`;
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* The score leads here, stamped with what it rests on. This is the one
            screen where the number is the entire subject, so it is set at the
            size of the subject rather than tucked into a metadata row. */}
        <div className="flex items-start gap-4">
          <ScoreAssay
            score={resume.resumeScore}
            target={85}
            basis="resume score"
            size="lg"
          />
          <div className="pt-1">
            <h1 className="font-display text-lg font-semibold leading-tight text-foreground">
              {resume.jobTitle}
            </h1>
            <p className="text-sm text-muted-foreground">{resume.companyName}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                Fit{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {resume.rawFitScore}
                </span>
              </span>
              <span>·</span>
              <span>Version {resume.version}</span>
              <Badge
                variant={resume.status === "approved" ? "default" : "secondary"}
                className="font-normal"
              >
                {statusLabel[resume.status]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ResumePreview
            jobId={resume.jobId}
            company={resume.companyName}
            role={resume.jobTitle}
          />
          <Button size="sm" variant="outline" onClick={() => download("pdf")}>
            <FileDown className="size-3.5" strokeWidth={1.75} />
            Export PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => download("docx")}>
            <FileText className="size-3.5" strokeWidth={1.75} />
            Export DOCX
          </Button>
          {applyUrl ? (
            <Button size="sm" variant="outline" asChild>
              <a href={applyUrl} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                Open application
              </a>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={openPrefilled}
            disabled={prefilling}
            title="Opens the form in a browser here with your answers filled in. It never submits."
          >
            {prefilling ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
            ) : (
              <Wand2 className="size-3.5" strokeWidth={1.75} />
            )}
            Open pre-filled
          </Button>
          <Button size="sm" onClick={onApprove} disabled={resume.status === "approved"}>
            <CheckCircle2 className="size-3.5" strokeWidth={1.75} />
            {resume.status === "approved" ? "Approved" : "Approve Resume"}
          </Button>
        </div>
      </div>

      {resume.scoreHistory.length > 1 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Score history:</span>
          {resume.scoreHistory.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="font-medium tabular-nums text-foreground">{s}</span>
              {i < resume.scoreHistory.length - 1 && <span>→</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
