"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/motion/primitives";
import { getUsage } from "@/lib/api/usage";
import { isLiveApi } from "@/lib/api/client";

/**
 * What the resume writer has cost, and what is left of the budget.
 *
 * The number that matters here is the one on the right of each bar — what is
 * *left* — because the budget is a control rather than a report. The backend
 * checks it before every request and falls back to the deterministic pipeline
 * when it is spent, so running out means resumes get slightly worse wording,
 * never that they fail to generate. The page says that outright, because a
 * spend limit that silently degrades output is worse than one that explains
 * itself.
 *
 * Cost is derived from published per-token rates at the time of each call, not
 * read back from Anthropic. It will track the invoice closely without being
 * it, and the footnote says so rather than implying a precision it lacks.
 */
export default function UsagePage() {
  const live = isLiveApi();
  const { data, isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: () => getUsage(30),
    enabled: live,
    refetchInterval: 30_000,
    retry: false,
  });

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="API usage" description="Token spend for resume wording." />
        <EmptyState
          icon={AlertCircle}
          title="Usage needs the CareerOS API"
          description="Every figure here is read from the local ledger. Start the backend on port 8000."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="API usage" description="Token spend for resume wording." />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="API usage" description="Token spend for resume wording." />
        <EmptyState
          icon={AlertCircle}
          title="Couldn't read the usage ledger"
          description="Showing nothing rather than zeros that would read as 'you have spent nothing'."
          className="flex-1"
        />
      </div>
    );
  }

  const u = data.data;
  const b = u.budget;
  const dayPct = b.dailyBudget ? Math.min(100, (b.today / b.dailyBudget) * 100) : 0;
  const monthPct = b.monthlyBudget ? Math.min(100, (b.month / b.monthlyBudget) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="API usage"
        description="Token spend for resume wording. Scoring stays deterministic and costs nothing."
      />

      {b.blocked && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-warning">
            Budget reached
          </p>
          <p className="mt-1 text-sm text-foreground">{b.reason}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Resumes still generate — the writer falls back to the rule-based
            wording it used before any model was configured. Raise{" "}
            <code className="font-mono text-[11px]">LLM_DAILY_BUDGET_USD</code> or{" "}
            <code className="font-mono text-[11px]">LLM_MONTHLY_BUDGET_USD</code> in{" "}
            <code className="font-mono text-[11px]">careeros-api/.env</code> to lift it.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Meter
          label="Today"
          spent={b.today}
          budget={b.dailyBudget}
          remaining={b.dailyRemaining}
          pct={dayPct}
        />
        <Meter
          label="This month"
          spent={b.month}
          budget={b.monthlyBudget}
          remaining={b.monthlyRemaining}
          pct={monthPct}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="calls (30d)" value={u.totals.calls} />
        <Stat label="input tokens" value={u.totals.inputTokens} />
        <Stat label="output tokens" value={u.totals.outputTokens} />
        <Stat
          label="cached reads"
          value={u.totals.cacheReadTokens}
          note="billed at a tenth of input"
        />
      </div>

      {u.totals.failed > 0 && (
        <p className="text-xs text-muted-foreground">
          {u.totals.failed} call{u.totals.failed === 1 ? "" : "s"} failed in this
          window. Failures are recorded too — a ledger that only shows successes
          drifts from the real bill.
        </p>
      )}

      {u.byPurpose.length > 0 && (
        <Panel title="Where it went">
          <table className="w-full text-sm">
            <tbody>
              {u.byPurpose.map((p) => (
                <tr key={p.purpose} className="border-b border-border last:border-0">
                  <td className="py-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {p.purpose}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {p.calls}
                  </td>
                  <td className="w-24 py-2 text-right font-medium tabular-nums text-foreground">
                    ${p.cost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {u.recent.length > 0 && (
        <Panel title="Recent calls">
          <table className="w-full text-sm">
            <tbody>
              {u.recent.map((c, i) => (
                <tr key={`${c.at}-${i}`} className="border-b border-border last:border-0">
                  <td className="py-2 font-mono text-[11px] text-muted-foreground">
                    {c.at.slice(5, 16).replace("T", " ")}
                  </td>
                  <td className="py-2 text-xs text-foreground">{c.purpose}</td>
                  <td className="py-2 font-mono text-[11px] text-muted-foreground">
                    {c.input_tokens.toLocaleString()} / {c.output_tokens.toLocaleString()}
                  </td>
                  <td className="w-20 py-2 text-right tabular-nums text-foreground">
                    {c.ok ? `$${c.cost_usd.toFixed(4)}` : (
                      <span className="text-warning">failed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {u.note}
      </p>
    </div>
  );
}

function Meter({
  label,
  spent,
  budget,
  remaining,
  pct,
}: {
  label: string;
  spent: number;
  budget: number;
  remaining: number;
  pct: number;
}) {
  const hot = pct >= 80;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          of ${budget.toFixed(2)}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
          ${spent.toFixed(4)}
        </span>
        <span className={`text-xs ${hot ? "text-warning" : "text-muted-foreground"}`}>
          ${remaining.toFixed(2)} left
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${hot ? "bg-warning" : "bg-primary"}`}
          style={{ width: `${Math.max(pct, spent > 0 ? 1.5 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-display text-2xl font-semibold tabular-nums text-foreground">
        <CountUp value={value} />
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      {note && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{note}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}
