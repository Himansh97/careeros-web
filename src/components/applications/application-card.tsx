"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/score-badge";
import { advanceApplication, nextStatus } from "@/lib/api/applications";
import { pipelineColumns, type ApplicationRecord } from "@/types/application";
import type { PipelineStatus } from "@/types/application";

export function ApplicationCard({ application }: { application: ApplicationRecord }) {
  const router = useRouter();
  const next = nextStatus(application.status as PipelineStatus);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => router.push(`/applications/${application.id}`)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Building2 className="size-3.5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-foreground">{application.title}</h3>
            <p className="truncate text-xs text-muted-foreground">{application.company.name}</p>
          </div>
          <ScoreBadge score={application.rawFitScore} size="sm" showLabel={false} />
        </div>
      </button>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {application.recruiterName && (
          <p className="flex items-center gap-1">
            <UserCheck className="size-3" strokeWidth={1.75} />
            {application.recruiterName}
          </p>
        )}
        <p className="line-clamp-2">{application.nextAction}</p>
      </div>

      {next && application.status !== "rejected" && (
        <Button
          size="sm"
          variant="ghost"
          className="mt-2 h-7 w-full justify-between px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            advanceApplication(application.id);
            const label = pipelineColumns.find((c) => c.value === next)?.label;
            toast.success(`Moved to ${label}`);
          }}
        >
          Advance
          <ArrowRight className="size-3" strokeWidth={1.75} />
        </Button>
      )}
    </div>
  );
}
