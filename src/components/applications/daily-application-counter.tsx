import { Flame, Target } from "lucide-react";

import {
  dailyApplicationProgress,
  type SubmissionRecord,
} from "@/lib/daily-application-progress";
import { cn } from "@/lib/utils";

interface DailyApplicationCounterProps {
  applications: readonly SubmissionRecord[];
  className?: string;
  now?: Date;
  timeZone?: string;
}

export function DailyApplicationCounter({
  applications,
  className,
  now,
  timeZone,
}: DailyApplicationCounterProps) {
  const progress = dailyApplicationProgress(applications, now, { timeZone });
  const complete = progress.remaining === 0;

  return (
    <section
      aria-labelledby="daily-application-heading"
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
    >
      <div className="grid gap-5 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Target className="size-3.5 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <h2
              id="daily-application-heading"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              Daily application mission
            </h2>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-semibold tracking-tight tabular-nums text-foreground">
              {progress.today} / {progress.goal}
            </span>
            <span className={cn("text-xs", complete ? "text-success" : "text-muted-foreground")}>
              {complete ? "Goal complete" : `${progress.remaining} remaining today`}
            </span>
          </div>

          <div
            className="mt-3 grid grid-cols-10 gap-1"
            role="progressbar"
            aria-label={`${progress.today} of ${progress.goal} applications submitted today`}
            aria-valuemin={0}
            aria-valuemax={progress.goal}
            aria-valuenow={Math.min(progress.today, progress.goal)}
            aria-valuetext={`${progress.percent}% of today's goal`}
          >
            {Array.from({ length: progress.goal }, (_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={cn(
                  "h-1.5 rounded-[1px]",
                  index < progress.filledSegments ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-3 sm:min-w-36 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full border",
              progress.streak > 0
                ? "border-warning/35 bg-warning/10 text-warning"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            <Flame className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="sr-only">{progress.streak} day streak</span>
          <div className="text-xs text-muted-foreground" aria-hidden="true">
            <span className="block font-display text-xl font-semibold tabular-nums text-foreground">
              {progress.streak}
            </span>{" "}
            day streak
          </div>
        </div>
      </div>
    </section>
  );
}
