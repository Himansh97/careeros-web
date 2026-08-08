"use client";

import { Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ResumeBullet as ResumeBulletType } from "@/types/resume";

const changeLabel: Record<string, string> = {
  added: "Added",
  reworded: "Reworded",
  reordered: "Reordered",
};

interface ResumeBulletProps {
  bullet: ResumeBulletType;
  mode: "tailored" | "original" | "side-by-side";
}

export function ResumeBullet({ bullet, mode }: ResumeBulletProps) {
  const changed = bullet.changeType !== "unchanged";
  const showOriginalOnly = mode === "original";
  const displayText = showOriginalOnly ? bullet.originalText ?? bullet.text : bullet.text;

  if (mode === "side-by-side" && changed) {
    return (
      <li className="grid grid-cols-2 gap-3 rounded-md bg-accent/40 p-2">
        <div className="text-xs text-muted-foreground line-through decoration-muted-foreground/40">
          {bullet.originalText ?? <span className="italic">(new)</span>}
        </div>
        <BulletBody bullet={bullet} text={bullet.text} changed />
      </li>
    );
  }

  return (
    <li className={cn("rounded-md p-2", changed && !showOriginalOnly && "bg-accent/40")}>
      <BulletBody bullet={bullet} text={displayText} changed={changed && !showOriginalOnly} />
    </li>
  );
}

function BulletBody({
  bullet,
  text,
  changed,
}: {
  bullet: ResumeBulletType;
  text: string;
  changed: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
      <p className="flex-1 text-sm leading-relaxed text-foreground">{text}</p>
      <div className="flex shrink-0 items-center gap-1">
        {changed && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Why this changed"
              >
                <Info className="size-3.5" strokeWidth={1.75} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-sm" side="left">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Badge variant="secondary" className="font-normal">
                  {changeLabel[bullet.changeType]}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {bullet.whyChanged ?? "Reworded for relevance to this role."}
              </p>
            </PopoverContent>
          </Popover>
        )}
        {bullet.evidence && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-primary hover:bg-primary/10"
                aria-label="View evidence"
              >
                <ShieldCheck className="size-3.5" strokeWidth={1.75} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-2 text-sm" side="left">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Source
                </span>
                <p className="text-foreground">{bullet.evidence.source}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Verified statement
                </span>
                <p className="text-muted-foreground">&ldquo;{bullet.evidence.verifiedStatement}&rdquo;</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Used to support
                </span>
                <p className="text-foreground">{bullet.evidence.usedToSupport}</p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
