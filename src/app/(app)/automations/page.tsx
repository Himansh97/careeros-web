"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Bot, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PipelineNodeCard } from "@/components/automation/pipeline-node";
import { isLiveApi } from "@/lib/api/client";
import {
  getAutomation,
  saveAutomationRules,
  type AutomationRules,
} from "@/lib/api/ops";
import { useAutopilot } from "@/lib/hooks/use-autopilot";
import { formatRelativeTime } from "@/lib/format";

const NUMERIC_RULES: { key: keyof AutomationRules; label: string; hint?: string }[] = [
  { key: "minimumFitToTailor", label: "Minimum fit to tailor" },
  { key: "autoRejectBelowFit", label: "Auto-reject below fit" },
  { key: "maxApplicationsPerDay", label: "Max per run", hint: "A ceiling, not a target" },
  { key: "minimumResumeScore", label: "Minimum resume score" },
  { key: "followUpDelayBusinessDays", label: "Follow-up delay (business days)" },
  { key: "recruiterConfidenceMinimum", label: "Recruiter confidence minimum" },
];

export default function AutomationsPage() {
  const live = isLiveApi();
  const qc = useQueryClient();
  const { run: handleRun, running } = useAutopilot();

  const { data, isLoading } = useQuery({
    queryKey: ["automation"],
    queryFn: getAutomation,
    enabled: live,
  });

  async function updateRule(key: keyof AutomationRules, value: string | number) {
    const res = await saveAutomationRules({ [key]: value } as Partial<AutomationRules>);
    if (res.ok) qc.invalidateQueries({ queryKey: ["automation"] });
  }

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Autopilot" description="Batch pipeline over live postings." />
        <EmptyState
          icon={AlertCircle}
          title="Autopilot isn't connected"
          description="Start the CareerOS API and set NEXT_PUBLIC_API_URL."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const status = data?.ok ? data.data : null;
  const lastRun = status?.lastRun;
  const rules = status?.rules;
  const stats = lastRun?.stats ?? {};

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Autopilot"
        description={status?.note ?? "Discovers, scores and tailors. Never submits or sends."}
        action={
          <Button size="sm" onClick={handleRun} disabled={running}>
            {running ? (
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" strokeWidth={1.75} />
            ) : (
              <Play className="size-3.5" strokeWidth={1.75} />
            )}
            {running ? "Running…" : "Run Autopilot"}
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              {running && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
              )}
              <span
                className={`relative inline-flex size-2 rounded-full ${running ? "bg-primary" : "bg-muted-foreground/50"}`}
              />
            </span>
            <Bot className="size-4 text-muted-foreground" strokeWidth={1.75} />
            <span className="text-sm font-medium text-foreground">Autopilot</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${running ? "bg-primary/10 font-medium text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {running ? "Running" : "Idle"}
            </span>
          </div>
          {lastRun && (
            <span className="text-xs text-muted-foreground">
              Last run {formatRelativeTime(lastRun.startedAt)} · {lastRun.status}
            </span>
          )}
        </div>
      </div>

      {lastRun ? (
        <>
          <div>
            <h2 className="mb-2 text-sm font-medium text-foreground">Last run</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <MetricCard label="Discovered" value={stats.discovered ?? 0} />
              <MetricCard label="Analyzed" value={stats.analyzed ?? 0} />
              <MetricCard label="Qualified" value={stats.qualified ?? 0} />
              <MetricCard label="Tailored" value={stats.tailored ?? 0} />
              <MetricCard label="Queued" value={stats.queuedForApproval ?? 0} />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-foreground">Pipeline</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lastRun.nodes.map((n) => (
                <PipelineNodeCard key={n.id} node={n} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Bot}
          title="No runs yet"
          description="Run Autopilot to discover live postings, score them against your evidence, and tailor the strongest matches."
        />
      )}

      {rules && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Automation rules</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Saved to the backend and applied on the next run.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NUMERIC_RULES.map((r) => (
              <label key={r.key} className="space-y-1">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <Input
                  type="number"
                  defaultValue={rules[r.key] as number}
                  onBlur={(e) => updateRule(r.key, Number(e.target.value))}
                  className="h-8"
                />
                {r.hint && (
                  <span className="text-[11px] text-muted-foreground/70">{r.hint}</span>
                )}
              </label>
            ))}

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Submission mode</span>
              <Select
                defaultValue={rules.submissionMode}
                onValueChange={(v) => {
                  updateRule("submissionMode", v);
                  if (v === "auto") {
                    toast.warning("Auto-submit isn't implemented", {
                      description:
                        "Runs always stop at the approval queue. This setting is recorded but the pipeline will not submit on your behalf.",
                    });
                  }
                }}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval">Approval required</SelectItem>
                  <SelectItem value="auto">Auto-submit</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
