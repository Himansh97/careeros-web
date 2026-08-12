"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceCapture } from "@/components/resume/evidence-capture";
import { listSkillGaps } from "@/lib/api/ops";
import { isLiveApi } from "@/lib/api/client";

/**
 * The one thing worth closing next, ranked across every role being targeted.
 *
 * Two gaps look identical on a single resume and are not equivalent: one
 * appearing in three roles scored 60, and one appearing in twenty scored 85.
 * Reach weighted by fit separates them.
 *
 * Where a gap is really an *evidence* gap — the skill is in the inventory but
 * no accomplishment demonstrates it — the fix is recording what was already
 * done, so the capture dialog is offered inline.
 */
export function SkillGaps() {
  const { data, isLoading } = useQuery({
    queryKey: ["skill-gaps"],
    queryFn: listSkillGaps,
    enabled: isLiveApi(),
  });

  if (!isLiveApi()) return null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!data?.ok || data.data.gaps.length === 0) return null;

  const { gaps, consideredJobs, minimumFit } = data.data;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <TrendingUp className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="text-sm font-medium text-foreground">What to close next</h2>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Across {consideredJobs} roles you score {minimumFit}+ on, ranked by reach
        weighted by fit. No time-to-learn estimate — that number would be invented.
      </p>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {gaps.slice(0, 6).map((gap) => {
          const evidenceGap = gap.note.startsWith("Listed");
          return (
            <div key={gap.skill} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{gap.skill}</span>
                  <span className="text-xs text-muted-foreground">
                    {gap.shareOfTargets}% of your targets
                  </span>
                  {gap.requiredIn > 0 && (
                    <span className="rounded bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                      required in {gap.requiredIn}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {gap.note}. Mean fit of those roles: {gap.meanFit}.
                </p>
              </div>
              {/* An evidence gap is closed by recording work already done, not
                  by learning anything — so offer that directly. */}
              {evidenceGap && <EvidenceCapture requirement={gap.skill} label="Add evidence" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
