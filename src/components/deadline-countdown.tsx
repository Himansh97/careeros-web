"use client";

import * as React from "react";
import { Hourglass } from "lucide-react";

import {
  deadlineCountdown,
  pad2,
  type DeadlineConfig,
} from "@/lib/deadline-countdown";
import { useNowMs } from "@/lib/hooks/use-now";
import { cn } from "@/lib/utils";

/**
 * The digital clock on the dashboard.
 *
 * The days figure is the hero and the hours:minutes:seconds sit beside it at a
 * quarter the size, because the useful number is "sixty days" and the ticking
 * part is there to make the sixty feel like a real quantity rather than a
 * label. All of it is `tabular-nums`, so the digits do not shift the layout as
 * they change — a proportional 1 is narrower than a 0, and a clock that jitters
 * every second is a clock you stop looking at.
 *
 * Screen readers get the sentence once, from `aria-label` on the section. The
 * ticking digits are `aria-hidden`: a live region updating every second reads
 * as an alarm going off continuously.
 */

const TONE = {
  calm: {
    ring: "border-border",
    accent: "text-foreground",
    bar: "bg-primary",
    chip: "bg-muted text-muted-foreground",
  },
  close: {
    ring: "border-warning/40",
    accent: "text-warning",
    bar: "bg-warning",
    chip: "bg-warning/10 text-warning",
  },
  critical: {
    ring: "border-destructive/45",
    accent: "text-destructive",
    bar: "bg-destructive",
    chip: "bg-destructive/10 text-destructive",
  },
  passed: {
    ring: "border-border",
    accent: "text-muted-foreground",
    bar: "bg-muted-foreground/40",
    chip: "bg-muted text-muted-foreground",
  },
} as const;

function Segment({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="rounded-md bg-muted px-2 py-1 font-mono text-lg font-semibold tabular-nums leading-none text-foreground">
        {pad2(value)}
      </span>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}

interface DeadlineCountdownCardProps {
  config: DeadlineConfig | null;
  /** The window the progress bar is drawn against. */
  totalDays?: number;
  className?: string;
}

export function DeadlineCountdownCard({
  config,
  totalDays,
  className,
}: DeadlineCountdownCardProps) {
  const nowMs = useNowMs();

  // No configured deadline means no widget. An invented date would be the one
  // number on this dashboard that traces back to nothing.
  if (!config) return null;

  // 0 is "the clock has not started" — server render and first client render.
  // Reserving the height stops the dashboard jumping when it does.
  if (nowMs === 0) {
    return (
      <section
        className={cn("h-[104px] rounded-lg border border-border bg-card", className)}
        aria-hidden="true"
      />
    );
  }

  const countdown = deadlineCountdown(config, new Date(nowMs), { totalDays });
  const tone = TONE[countdown.urgency];
  const dayWord = countdown.daysLeft === 1 ? "day" : "days";

  // The label is the candidate's own sentence, and theirs already says "days
  // left". Printing the unit again under the number gives "DAYS LEFT TO THE
  // BEST JOB / 90 / days left". The label wins — it is the specific one.
  const labelSaysDays = /\bdays?\s+left\b/i.test(config.label);

  const deadlineOn = new Intl.DateTimeFormat("en-US", {
    timeZone: config.timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${config.date}T12:00:00Z`));

  const spoken = countdown.passed
    ? `${config.label}: passed on ${deadlineOn}.`
    : countdown.daysLeft === 0
      ? `${config.label}: today is the last day, ${countdown.hours} hours remaining.`
      : `${config.label}: ${countdown.daysLeft} ${dayWord} remaining, until ${deadlineOn}.`;

  return (
    <section
      aria-label={spoken}
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        tone.ring,
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Hourglass className={cn("size-3.5", tone.accent)} strokeWidth={1.75} aria-hidden="true" />
            <h2 className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {config.label}
            </h2>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums",
                tone.chip,
              )}
            >
              <time dateTime={countdown.isoDate}>{deadlineOn}</time>
            </span>
          </div>

          <div className="mt-2 flex items-end gap-2" aria-hidden="true">
            <span
              className={cn(
                "font-display text-5xl font-semibold leading-none tracking-tight tabular-nums",
                tone.accent,
              )}
            >
              {countdown.daysLeft}
            </span>
            {(countdown.passed || !labelSaysDays) && (
              <span className="pb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {countdown.passed ? "days — passed" : `${dayWord} left`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2" aria-hidden="true">
          <Segment value={countdown.hours} unit="hrs" />
          <span className="pt-1.5 font-mono text-lg leading-none text-muted-foreground/50">:</span>
          <Segment value={countdown.minutes} unit="min" />
          <span className="pt-1.5 font-mono text-lg leading-none text-muted-foreground/50">:</span>
          <Segment value={countdown.seconds} unit="sec" />
        </div>
      </div>

      <div className="h-1 w-full bg-muted" aria-hidden="true">
        <div
          className={cn("h-full transition-[width] duration-1000 ease-linear", tone.bar)}
          style={{ width: `${(countdown.elapsed * 100).toFixed(3)}%` }}
        />
      </div>

      {countdown.note && (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-5">
          {countdown.note}
        </p>
      )}
    </section>
  );
}
