"use client";

import { toast } from "sonner";
import { FileDown, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import type { ResumeVersion } from "@/types/resume";

const statusLabel: Record<ResumeVersion["status"], string> = {
  draft: "Draft",
  ready: "Ready",
  approved: "Approved",
};

interface ResumeHeaderProps {
  resume: ResumeVersion;
  onApprove: () => void;
}

export function ResumeHeader({ resume, onApprove }: ResumeHeaderProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">
            {resume.jobTitle} <span className="font-normal text-muted-foreground">@ {resume.companyName}</span>
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Raw fit <span className="font-medium text-foreground">{resume.rawFitScore}</span></span>
            <span>·</span>
            <span className="flex items-center gap-1">
              Resume score <ScoreBadge score={resume.resumeScore} size="sm" />
            </span>
            <span>·</span>
            <span>Version V{resume.version}</span>
            <Badge variant={resume.status === "approved" ? "default" : "secondary"} className="font-normal">
              {statusLabel[resume.status]}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.info("PDF export isn't connected yet — no document-generation tool is wired up.")
            }
          >
            <FileDown className="size-3.5" strokeWidth={1.75} />
            Export PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.info("DOCX export isn't connected yet — no document-generation tool is wired up.")
            }
          >
            <FileText className="size-3.5" strokeWidth={1.75} />
            Export DOCX
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
