import { Progress } from "@/components/ui/progress";
import type { MatchBreakdown as MatchBreakdownType } from "@/types/job";

const rows: { key: keyof MatchBreakdownType; label: string }[] = [
  { key: "mandatory", label: "Mandatory requirements" },
  { key: "technical", label: "Technical" },
  { key: "experience", label: "Experience" },
  { key: "domain", label: "Domain" },
  { key: "education", label: "Education" },
  { key: "logistics", label: "Logistics" },
];

export function MatchBreakdown({ breakdown }: { breakdown: MatchBreakdownType }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium tabular-nums text-foreground">{breakdown[row.key]}%</span>
          </div>
          <Progress value={breakdown[row.key]} className="h-1.5" />
        </div>
      ))}
    </div>
  );
}
