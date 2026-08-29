"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, Check, Lock, PlayCircle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/primitives";
import { listLessons, type LessonSummary } from "@/lib/api/learn";

/**
 * Two tracks, side by side, each an ordered path rather than a menu.
 *
 * The order is the teaching: grain before joins, tokens before attention. A
 * lesson whose prerequisite is untaught is shut, and the server enforces that
 * rather than the client suggesting it — the drill engine next door declares
 * prerequisites and gates nothing, and its lock in `mission-map.tsx` is dead
 * code because `clearedDrillIds` is never passed to it.
 *
 * Levels are shown because they set expectations honestly: "advanced" tells you
 * the indexes lesson will be harder than the grain one, which is worth knowing
 * before you start rather than after.
 */

const TRACK_TITLE: Record<string, string> = {
  sql: "SQL",
  llm: "LLM engineering",
};

const TRACK_BLURB: Record<string, string> = {
  sql: "Grain to query plans. What the analyst roles you're applying to screen on.",
  llm: "Tokens to evals. What you're building with on the side.",
};

const LEVEL_TONE: Record<string, string> = {
  foundation: "text-muted-foreground",
  working: "text-info",
  interview: "text-warning",
  advanced: "text-primary",
};

function LessonRow({ lesson, index }: { lesson: LessonSummary; index: number }) {
  const motionSafe = useMotionSafe();
  const done = lesson.status === "explained" || lesson.status === "mastered";

  const body = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        lesson.unlocked
          ? "border-border bg-card hover:border-primary/30 hover:bg-accent/40"
          : "border-dashed border-border bg-muted/30",
      )}
    >
      <span className="mt-0.5 shrink-0">
        {done ? (
          <Check className="size-4 text-success" strokeWidth={1.75} />
        ) : !lesson.unlocked ? (
          <Lock className="size-4 text-muted-foreground/60" strokeWidth={1.75} />
        ) : lesson.status === "taught" ? (
          <PlayCircle className="size-4 text-primary" strokeWidth={1.75} />
        ) : (
          <span className="ml-1 block size-2 rounded-full bg-border" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {String(lesson.order).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "text-sm font-medium",
              lesson.unlocked ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {lesson.title}
          </span>
          <span
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.14em]",
              LEVEL_TONE[lesson.level] ?? "text-muted-foreground",
            )}
          >
            {lesson.level}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {lesson.unlocked
            ? lesson.hook
            : /* Say what would open it, rather than only that it is shut. */
              `Opens after ${lesson.prerequisites.join(", ")}.`}
        </p>
      </div>
    </div>
  );

  if (!lesson.unlocked) return body;

  return (
    <motion.div
      initial={motionSafe ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: motionSafe ? index * 0.04 : 0 }}
    >
      <Link href={`/prep/learn/${lesson.id}`} className="block">
        {body}
      </Link>
    </motion.div>
  );
}

export default function LearnPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => listLessons(),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="space-y-4">
        <PageHeader title="Learn" description="Two tracks, taught in order." />
        <EmptyState
          icon={AlertCircle}
          title="Not connected"
          description="The CareerOS API isn't reachable — start it on port 8000."
        />
      </div>
    );
  }

  const { lessons, tracks, taught, total, next } = data.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Learn"
        description="Two tracks running side by side — one for the interviews, one for what you're building. Taught in order, because the order is the teaching."
        action={
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {taught}/{total} started
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {tracks.map((track) => {
          const rows = lessons.filter((l) => l.track === track);
          const resume = next[track];
          return (
            <section key={track} className="space-y-2">
              <header className="flex items-baseline justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {TRACK_TITLE[track] ?? track}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {TRACK_BLURB[track] ?? ""}
                  </p>
                </div>
                {resume && (
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link href={`/prep/learn/${resume}`}>Continue</Link>
                  </Button>
                )}
              </header>
              <div className="space-y-2">
                {rows.map((lesson, i) => (
                  <LessonRow key={lesson.id} lesson={lesson} index={i} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
