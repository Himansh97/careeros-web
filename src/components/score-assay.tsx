import { cn } from "@/lib/utils";
import { scoreLabel } from "@/components/score-badge";

/**
 * A score, stamped with what it rests on.
 *
 * The signature element of this product, and the one place the design is
 * allowed to be loud.
 *
 * Every competitor shows a fit score as a coloured pill: a number, a cheerful
 * word, no basis. This system's entire claim is the opposite — it will show 80
 * and tell you the gap is real rather than show 98 and flatter you. A pill
 * cannot carry that. It says "89 Strong" in the same voice whether the number
 * was earned or invented.
 *
 * So the number is stamped like a hallmark: set large in the display face,
 * ruled off, with its basis directly underneath in the utility face. The
 * qualifier is not a decoration beside the number — it is structurally part of
 * it, and you cannot read one without the other. That is the whole argument of
 * the product expressed as a single object.
 *
 * The small inline pill (`ScoreBadge`) stays for dense rows: a hallmark at
 * eleven pixels is illegible, and shrinking this one would be exactly the kind
 * of decoration that survives past its usefulness.
 */
interface ScoreAssayProps {
  score: number;
  /** What the number rests on — "resume score", "of 100 requirements met". */
  basis?: string;
  /** The lower number this one is measured against, when there is one. */
  target?: number;
  size?: "md" | "lg";
  className?: string;
}

function tone(score: number): string {
  if (score >= 85) return "text-primary";
  if (score >= 70) return "text-foreground";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export function ScoreAssay({
  score,
  basis,
  target,
  size = "md",
  className,
}: ScoreAssayProps) {
  const label = scoreLabel(score);
  const short = target !== undefined && score < target;

  return (
    <div
      className={cn("inline-flex flex-col items-start", className)}
      aria-label={`${score} out of 100 — ${label}${
        short ? `, ${target - score} short of ${target}` : ""
      }`}
    >
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-display font-semibold leading-none tracking-tight tabular-nums",
            tone(score),
            size === "md" ? "text-3xl" : "text-5xl"
          )}
        >
          {score}
        </span>
        <span
          className={cn(
            "font-mono text-muted-foreground/60",
            size === "md" ? "text-xs" : "text-sm"
          )}
        >
          /100
        </span>
      </div>

      {/* The rule is the stamp. It ties the number to its basis so neither can
          be read alone — which is the point of the whole component. */}
      <span
        className={cn(
          "mt-1 block h-px w-full bg-current opacity-25",
          tone(score)
        )}
      />

      <span className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {short ? `${target - score} short of ${target}` : basis ?? label}
      </span>
    </div>
  );
}
