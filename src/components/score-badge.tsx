import { cn } from "@/lib/utils";

/**
 * One ladder for how good a score is, used everywhere a score is shown.
 *
 * There were three. `scoreLabel` and the badge broke at 90/80/70/60 while
 * `ScoreAssay.tone` broke at 85/70/60, so an 87 was "Strong" in the badge and
 * top-band in the assay — the same number reading differently on the same
 * screen. Anything that colours or names a score derives it from here.
 */
export type ScoreBand = "excellent" | "strong" | "good" | "partial" | "weak";

export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return "excellent";
  if (score >= 80) return "strong";
  if (score >= 70) return "good";
  if (score >= 60) return "partial";
  return "weak";
}

const BAND_LABEL: Record<ScoreBand, string> = {
  excellent: "Excellent",
  strong: "Strong",
  good: "Good",
  partial: "Partial",
  weak: "Weak",
};

export function scoreLabel(score: number): string {
  return BAND_LABEL[scoreBand(score)];
}

/**
 * Colour by meaning, and never `primary`.
 *
 * `--primary` and `--destructive` are the same value — NASA red — so a score of
 * 92 rendering `text-primary` was painted in exactly the colour reserved for an
 * error and a NO-GO. Red reads as stop whatever the token is called. Primary
 * now means brand and call-to-action; how good a score is comes from the
 * semantic tokens.
 *
 * `excellent` and `strong` were byte-identical, so the two best bands were
 * indistinguishable. They share a hue because they mean the same kind of thing,
 * and differ in weight because they differ in degree.
 */
const BAND_CLASSES: Record<ScoreBand, string> = {
  excellent: "border-success/40 bg-success/15 text-success",
  strong: "border-success/20 bg-success/10 text-success",
  good: "border-border bg-muted text-foreground/70",
  // Was three raw oklch() literals, off the token system entirely — which is
  // what `--warning` exists for and exactly what this band means.
  partial: "border-warning/40 bg-warning/10 text-warning",
  weak: "border-destructive/20 bg-destructive/10 text-destructive",
};

/** Foreground-only tone, for a number that is not sitting in a chip. */
export const BAND_TONE: Record<ScoreBand, string> = {
  excellent: "text-success",
  strong: "text-success",
  good: "text-foreground",
  partial: "text-warning",
  weak: "text-destructive",
};

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
        BAND_CLASSES[scoreBand(score)],
        scoreBand(score) === "excellent" && "font-semibold",
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
