import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
