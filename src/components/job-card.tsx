"use client";

import { Bookmark, X, MapPin, Clock, UserCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatSalary } from "@/lib/format";
import { ScoreBadge } from "@/components/score-badge";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  selected?: boolean;
  onSelect: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onDismiss: (job: Job) => void;
}

const arrangementLabel: Record<Job["workArrangement"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

export function JobCard({ job, selected, onSelect, onToggleSave, onDismiss }: JobCardProps) {
  const salary = formatSalary(job.salary);

  return (
    <div
      className={cn(
        "group flex items-start gap-1 rounded-lg border transition-colors",
        selected
          ? "border-primary/40 bg-accent"
          : "border-border bg-card hover:border-primary/25 hover:bg-accent/40"
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(job)}
        aria-current={selected ? "true" : undefined}
        className="flex flex-1 items-start gap-3 rounded-lg px-3.5 py-3 text-left"
      >
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Building2 className="size-4" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-foreground">{job.title}</h3>
              <p className="truncate text-xs text-muted-foreground">{job.company.name}</p>
            </div>
            {typeof job.rawFitScore === "number" && (
              <ScoreBadge score={job.rawFitScore} size="sm" />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" strokeWidth={1.75} />
              {job.location} · {arrangementLabel[job.workArrangement]}
            </span>
            {salary && <span>{salary}</span>}
            {job.postedAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" strokeWidth={1.75} />
                {formatRelativeTime(job.postedAt)}
              </span>
            )}
            <span className="rounded bg-muted px-1.5 py-0.5">{job.source}</span>
            {job.recruiterStatus === "found" && (
              <span className="inline-flex items-center gap-1 text-primary">
                <UserCheck className="size-3" strokeWidth={1.75} />
                Recruiter found
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="flex shrink-0 flex-col items-center gap-1 py-3 pr-2.5">
        <button
          type="button"
          onClick={() => onToggleSave(job)}
          aria-label={job.saved ? "Unsave job" : "Save job"}
          aria-pressed={job.saved}
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground",
            job.saved && "text-primary"
          )}
        >
          <Bookmark className="size-3.5" strokeWidth={1.75} fill={job.saved ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={() => onDismiss(job)}
          aria-label="Dismiss job"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
