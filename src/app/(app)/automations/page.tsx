"use client";

import { toast } from "sonner";
import { AlertCircle, Bot, Pause, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PipelineNodeCard } from "@/components/automation/pipeline-node";
import { AutomationRulesPanel } from "@/components/automation/automation-rules";
import { mockPipelineNodes, mockTodayStats } from "@/lib/mock/automation";

// A data source exists if either the live backend or the mock layer is on.
const hasDataSource = () =>
  process.env.NEXT_PUBLIC_API_URL !== "" && process.env.NEXT_PUBLIC_API_URL !== undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// LIVE_UNAVAILABLE: no live backend equivalent for this page yet.
const liveMode = () =>
  process.env.NEXT_PUBLIC_API_URL !== "" && process.env.NEXT_PUBLIC_API_URL !== undefined;

export default function AutomationsPage() {
  if (liveMode()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Autopilot" description="Connected to the live CareerOS API." />
        <EmptyState
          icon={AlertCircle}
          title="Not available on the live backend yet"
          description="Automated multi-job runs aren't wired to the live backend yet. Discovery, scoring, and tailoring all work today from the Discover Jobs page."
          className="flex-1"
        />
      </div>
    );
  }

  if (!hasDataSource()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Autopilot"
          description="Mission control for the discover → qualify → tailor → audit → apply → outreach → follow-up pipeline."
        />
        <EmptyState
          icon={AlertCircle}
          title="Autopilot isn't connected"
          description="Pipeline status, per-stage logs, and automation rules will run here once automation is wired up. Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview."
          className="flex-1"
        />
      </div>
    );
  }

  const running = mockPipelineNodes.find((n) => n.state === "running");

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Autopilot"
        description="Mission control for the full discovery-to-follow-up pipeline."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info("Pausing requires a connected automation backend.")}
            >
              <Pause className="size-3.5" strokeWidth={1.75} />
              Pause
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast.info("Full logs land here once automation is connected.")}>
              <ActivityIcon className="size-3.5" strokeWidth={1.75} />
              View Activity
            </Button>
          </div>
        }
      />

      {/* Status banner */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <Bot className="size-4 text-muted-foreground" strokeWidth={1.75} />
            <span className="text-sm font-medium text-foreground">Autopilot</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Running
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Current task: {running?.detail ?? "—"}
          </span>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">35 / 48</span>
          </div>
          <Progress value={(35 / 48) * 100} className="h-1.5" />
        </div>
      </div>

      {/* Today */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-foreground">Today</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {mockTodayStats.map((s) => (
            <MetricCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-foreground">Pipeline</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {mockPipelineNodes.map((node) => (
            <PipelineNodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>

      <AutomationRulesPanel />
    </div>
  );
}
