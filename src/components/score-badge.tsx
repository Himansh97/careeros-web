import { cn } from "@/lib/utils";

export function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Partial";
  return "Weak";
}

function scoreClasses(score: number): string {
  if (score >= 90) return "bg-primary/10 text-primary border-primary/20";
  if (score >= 80) return "bg-primary/10 text-primary border-primary/20";
  if (score >= 70) return "bg-muted text-foreground/70 border-border";
  if (score >= 60) return "bg-[oklch(0.85_0.12_80)]/20 text-[oklch(0.5_0.12_70)] border-[oklch(0.85_0.12_80)]/40 dark:text-[oklch(0.8_0.12_80)]";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ score, size = "md", showLabel = true, className }: ScoreBadgeProps) {
  const label = scoreLabel(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium tabular-nums",
        scoreClasses(score),
        size === "sm" && "px-1.5 py-0.5 text-[11px]",
        size === "md" && "px-2 py-0.5 text-xs",
        size === "lg" && "px-2.5 py-1 text-sm",
        className
      )}
      aria-label={`Fit score ${score} out of 100 — ${label}`}
    >
      <span>{score}</span>
      {showLabel && <span className="font-normal opacity-80">{label}</span>}
    </span>
  );
}
