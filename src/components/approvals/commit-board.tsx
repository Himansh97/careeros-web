import type { CommitCall, CommitCriterion } from "@/types/approval";

/**
 * The launch commit criteria for one application.
 *
 * This card used to say "Ready to apply" beside a fit score, while the system
 * separately knew four other things that could disqualify the same
 * application: whether the candidate is eligible at all, whether the req is
 * still open, whether the resume cleared its target, and whether the required
 * skills have any evidence behind them. None of that was on the screen where
 * the decision gets made.
 *
 * Each criterion reports on its own system. A criterion marked `holds` stops
 * the launch by itself, regardless of every other call — which is how a real
 * launch status check works, and how this queue has always worked without
 * saying so: one eligibility knockout kills a 96-fit role outright.
 *
 * Cautions are stated and do not hold. A resume four points short is worth
 * sending to a role that fits, and a system that refused would be overriding a
 * decision that belongs to the candidate.
 */
const STYLE: Record<CommitCriterion["verdict"], { label: string; className: string }> = {
  go: { label: "GO", className: "text-success" },
  caution: { label: "CAUTION", className: "text-warning" },
  nogo: { label: "NO-GO", className: "text-primary" },
};

export function CommitBoard({
  criteria,
  commit,
}: {
  criteria: CommitCriterion[];
  commit: CommitCall;
}) {
  if (criteria.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Commit criteria
        </span>
        <span
          className={`font-mono text-[11px] font-medium tracking-[0.1em] ${STYLE[commit.verdict].className}`}
        >
          {commit.verdict === "nogo" ? "HOLD" : STYLE[commit.verdict].label}
        </span>
      </div>

      <ul>
        {criteria.map((c) => (
          <li
            key={c.name}
            className="grid grid-cols-[6.5rem_1fr_auto] items-baseline gap-2 border-b border-border/60 py-1 last:border-b-0"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {c.name}
            </span>
            <span className="min-w-0 text-xs text-muted-foreground">{c.readout}</span>
            <span
              className={`font-mono text-[10px] font-medium tracking-[0.1em] ${STYLE[c.verdict].className}`}
            >
              {STYLE[c.verdict].label}
            </span>
          </li>
        ))}
      </ul>

      {commit.verdict === "nogo" && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {commit.summary}. Approving is still yours to do — this says what the
          system found, not what you are allowed to decide.
        </p>
      )}
    </div>
  );
}
