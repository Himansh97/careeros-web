import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EvidenceCapture } from "@/components/resume/evidence-capture";
import type { RecruiterAudit, RecruiterDecision } from "@/types/resume";

const decisionStyle: Record<RecruiterDecision, string> = {
  SHORTLIST: "bg-primary/10 text-primary border-primary/20",
  REVIEW: "bg-[oklch(0.85_0.12_80)]/20 text-[oklch(0.5_0.12_70)] border-[oklch(0.85_0.12_80)]/40 dark:text-[oklch(0.8_0.12_80)]",
  REJECT: "bg-destructive/10 text-destructive border-destructive/20",
};

export function RecruiterAuditPanel({ audit }: { audit: RecruiterAudit }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Recruiter Audit</h2>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl font-semibold tabular-nums text-foreground">{audit.overall}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <Badge className={`ml-auto border font-medium ${decisionStyle[audit.decision]}`} variant="outline">
          {audit.decision}
        </Badge>
      </div>

      {/* Says whether re-tailoring can close the gap, or whether only new
          evidence can. Without this the score is a number to be disappointed
          by rather than one to act on. */}
      {audit.shortfall && (
        <div
          className={`mt-3 rounded-md border p-2.5 text-xs ${
            audit.shortfall.evidenceBound >= audit.shortfall.tailoringBound
              ? "border-warning/30 bg-warning/10 text-warning"
              : "border-info/30 bg-info/10 text-info"
          }`}
        >
          <p className="font-medium">
            {audit.shortfall.short} short of {audit.shortfall.target}
          </p>
          <p className="mt-0.5 opacity-90">{audit.shortfall.summary}</p>
          {/* The gap names a requirement. Offer the one action that can close
              it honestly — recording evidence that exists but was never
              written down — right where the gap is visible. */}
          {audit.shortfall.evidenceBound >= audit.shortfall.tailoringBound &&
            audit.shortfall.missing.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {audit.shortfall.missing.slice(0, 3).map((req) => (
                  <EvidenceCapture key={req} requirement={req} />
                ))}
              </div>
            )}
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {audit.categories.map((cat) => (
          <div key={cat.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-medium tabular-nums text-foreground">
                {cat.score}/{cat.max}
              </span>
            </div>
            <Progress value={(cat.score / cat.max) * 100} className="h-1.5" />
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-4">
        <div>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            What works
          </h3>
          <ul className="space-y-1.5">
            {audit.whatWorks.map((point, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" strokeWidth={2} />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Potential concern{audit.concerns.length > 1 ? "s" : ""}
          </h3>
          <ul className="space-y-1.5">
            {audit.concerns.map((point, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                <AlertTriangle
                  className="mt-0.5 size-3 shrink-0 text-[oklch(0.6_0.15_70)] dark:text-[oklch(0.8_0.12_80)]"
                  strokeWidth={2}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
