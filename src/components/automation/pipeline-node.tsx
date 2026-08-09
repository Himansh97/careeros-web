"use client";

import { toast } from "sonner";
import { Check, Loader2, Clock, ShieldAlert, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeState, PipelineNode as PipelineNodeType } from "@/types/automation";

const stateConfig: Record<
  NodeState,
  { icon: typeof Check; label: string; className: string; iconClassName?: string }
> = {
  complete: { icon: Check, label: "Complete", className: "border-primary/30 bg-primary/5 text-foreground" },
  running: {
    icon: Loader2,
    label: "Running",
    className: "border-primary/50 bg-primary/10 text-foreground",
    iconClassName: "animate-spin motion-reduce:animate-none",
  },
  queued: { icon: Clock, label: "Queued", className: "border-border bg-card text-muted-foreground" },
  blocked: {
    icon: ShieldAlert,
    label: "Blocked",
    className:
      "border-[oklch(0.85_0.12_80)]/50 bg-[oklch(0.85_0.12_80)]/10 text-foreground",
  },
  failed: { icon: XCircle, label: "Failed", className: "border-destructive/40 bg-destructive/5 text-foreground" },
  idle: { icon: Minus, label: "Idle", className: "border-border bg-card text-muted-foreground" },
};

export function PipelineNodeCard({ node }: { node: PipelineNodeType }) {
  const cfg = stateConfig[node.state];
  const Icon = cfg.icon;

  return (
    <button
      type="button"
      onClick={() =>
        toast.info(`${node.label}: ${cfg.label}`, {
          description: node.detail ?? "Per-node logs appear here once automation is connected.",
        })
      }
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-accent/40",
        cfg.className
      )}
    >
      <Icon className={cn("size-4 shrink-0", cfg.iconClassName)} strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{node.label}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {cfg.label}
          </span>
        </div>
        {node.detail && (
          <p className="truncate text-xs text-muted-foreground">{node.detail}</p>
        )}
      </div>
    </button>
  );
}
