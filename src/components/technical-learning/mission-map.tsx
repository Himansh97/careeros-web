import Link from "next/link";
import { Check, CircleDot, LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";


export interface SkillProgress {
  skill: string;
  cleared: number;
  total: number;
  mastered: boolean;
  personalBest: number;
}

export interface MissionDrill {
  id: string;
  title: string;
  skill: string;
  concept: string;
  track: string;
  prerequisites: string[];
}

function statusFor(progress: SkillProgress | undefined) {
  if (progress?.mastered) return "mastered" as const;
  if ((progress?.cleared ?? 0) > 0) return "practising" as const;
  return "uncharted" as const;
}

export function MissionMap({
  skills,
  drills,
  clearedDrillIds = [],
}: {
  skills: SkillProgress[];
  drills: MissionDrill[];
  clearedDrillIds?: string[];
}) {
  const known = new Set(drills.map((drill) => drill.id));
  const cleared = new Set(clearedDrillIds);

  return (
    <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
      {drills.map((drill, index) => {
        const progress = skills.find((item) => item.skill === drill.skill);
        const status = statusFor(progress);
        const invalidPrerequisite = drill.prerequisites.some((id) => !known.has(id));
        const unmetPrerequisite = cleared.size > 0 && drill.prerequisites.some((id) => !cleared.has(id));
        const locked = invalidPrerequisite || unmetPrerequisite;
        const content = (
          <>
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Route {String(index + 1).padStart(2, "0")}
              </span>
              {locked ? (
                <LockKeyhole className="size-4 text-muted-foreground" aria-hidden="true" />
              ) : status === "mastered" ? (
                <Check className="size-4 text-success" aria-hidden="true" />
              ) : (
                <CircleDot className="size-4 text-primary" aria-hidden="true" />
              )}
            </div>
            <h3 className="mt-8 font-heading text-xl leading-tight">{drill.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{drill.concept.replaceAll("-", " ")}</p>
            <div className="mt-8 flex items-end justify-between gap-3">
              <span
                className={cn(
                  "font-mono text-[10px] tracking-[0.14em] uppercase",
                  status === "mastered" ? "text-success" : "text-muted-foreground",
                )}
              >
                {locked ? "Locked" : status}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {progress?.cleared ?? 0}/{progress?.total ?? 0}
              </span>
            </div>
          </>
        );

        return locked ? (
          <div key={drill.id} className="min-h-56 bg-card p-5 opacity-65" aria-label={`${drill.title}, locked`}>
            {content}
          </div>
        ) : (
          <Link
            key={drill.id}
            href={`/prep/technical/${drill.track}/${drill.concept}?drill=${encodeURIComponent(drill.id)}`}
            aria-label={`${drill.title}, ${status}`}
            className="min-h-56 bg-card p-5 transition-colors hover:bg-accent/40 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
