"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Building2, MapPin, ArrowUpRight, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { MatchBreakdown } from "@/components/match-breakdown";
import { formatSalary } from "@/lib/format";
import type { Job } from "@/types/job";

export function JobDetailPanel({ job }: { job: Job }) {
  const salary = formatSalary(job.salary);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Building2 className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{job.title}</h2>
              <p className="text-sm text-muted-foreground">{job.company.name}</p>
            </div>
          </div>
          {typeof job.rawFitScore === "number" && <ScoreBadge score={job.rawFitScore} size="lg" />}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" strokeWidth={1.75} />
            {job.location}
          </span>
          {salary && <span>{salary}</span>}
          <Badge variant="secondary" className="font-normal">{job.source}</Badge>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              toast.info("Resume tailoring isn't connected yet — this will generate a job-specific resume version once wired up.")
            }
          >
            <FileText className="size-3.5" strokeWidth={1.75} />
            Tailor Resume
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.info("Application prep isn't connected yet — this will fill and stage the application for your review.")
            }
          >
            <Send className="size-3.5" strokeWidth={1.75} />
            Prepare Application
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {job.strongMatches && job.strongMatches.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Why this matches
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {job.strongMatches.map((s) => (
                <Badge key={s} variant="secondary" className="font-normal">
                  {s}
                </Badge>
              ))}
            </div>
            {job.gaps && job.gaps.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Gap: {job.gaps.join(", ")}
              </p>
            )}
          </div>
        )}

        {job.matchBreakdown && (
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Match breakdown
            </h3>
            <MatchBreakdown breakdown={job.matchBreakdown} />
          </div>
        )}

        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View full details
          <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
