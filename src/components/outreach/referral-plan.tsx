"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getReferralStrategy } from "@/lib/api/ops";
import { isLiveApi } from "@/lib/api/client";

/**
 * The approach, not just the address.
 *
 * Most outreach fails for reasons unrelated to finding an email: it goes to
 * the wrong person, or it asks a stranger for a referral in the first message.
 * A referral spends the giver's credibility, and nobody spends that on a name
 * they met ten seconds ago — so the plan opens with something cheap to answer
 * and the ask only appears if they engage.
 *
 * Recruiters are the exception and are treated as one: screening candidates is
 * their job, so being coy with them wastes everyone's time.
 */
export function ReferralPlan({ jobId }: { jobId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["referral-strategy", jobId],
    queryFn: () => getReferralStrategy(jobId),
    enabled: isLiveApi(),
  });

  if (!isLiveApi()) return null;
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data?.ok || !data.data.available || !data.data.best || !data.data.plan) return null;

  const { best, plan, note } = data.data;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5">
        <Users className="size-4 text-muted-foreground" strokeWidth={1.75} />
        <h2 className="text-sm font-medium text-foreground">Best path in</h2>
      </div>

      <div className="mt-2 rounded-md border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{best.name}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {best.role}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{best.title}</p>
        <ul className="mt-1.5 space-y-0.5">
          {best.why.map((w) => (
            <li key={w} className="text-xs text-muted-foreground">
              · {w}
            </li>
          ))}
        </ul>
      </div>

      <ol className="mt-3 space-y-2">
        {plan.steps.map((step) => (
          <li key={step.day} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
              Day {step.day}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-foreground">{step.action}</p>
              <p className="text-xs text-muted-foreground">{step.why}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
        <ArrowRight className="mt-0.5 size-3 shrink-0" strokeWidth={1.75} />
        {plan.note} {note}
      </p>
    </div>
  );
}
