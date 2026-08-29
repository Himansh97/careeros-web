"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/primitives";
import { getRound } from "@/lib/api/round";

/**
 * The round, on the dashboard, because otherwise you will forget it exists.
 *
 * That is the known failure of a daily challenge and it was named before this
 * was built: it is a separate thing you have to remember to open, which is how
 * every study app dies. So it sits beside the application counter, on the page
 * that already gets opened, and says what it is asking about rather than just
 * "practise".
 *
 * Done for the day, it collapses to one line and gets out of the way. A prompt
 * that keeps asking after you have complied is a prompt you learn to ignore.
 */
export function RoundStrip() {
  const motionSafe = useMotionSafe();
  const { data } = useQuery({ queryKey: ["round"], queryFn: getRound, retry: false });

  if (!data?.ok) return null;
  const state = data.data;
  if (state.items.length === 0) return null;

  if (state.completed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
        <Check className="size-4 text-success" strokeWidth={1.75} />
        <span className="text-muted-foreground">Today&rsquo;s round is done.</span>
        {state.streak > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground">
            <Flame className="size-3.5 text-primary" strokeWidth={1.75} />
            <span className="font-medium tabular-nums text-foreground">{state.streak}</span>
            day{state.streak === 1 ? "" : "s"}
          </span>
        )}
      </div>
    );
  }

  const top = state.items[0];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex gap-1.5">
        {state.items.map((item, i) => (
          <motion.span
            key={item.term}
            className={cn("size-1.5 rounded-full", i === 0 ? "bg-primary" : "bg-border")}
            animate={motionSafe && i === 0 ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
            transition={
              motionSafe && i === 0
                ? { duration: 2, repeat: Infinity }
                : { duration: 0 }
            }
          />
        ))}
      </div>

      <p className="min-w-0 text-sm text-foreground">
        {/* The demand count is the reason to bother, so it leads. */}
        <span className="font-medium">{top.demand}</span>
        <span className="text-muted-foreground">
          {top.demand === 1 ? " staged job asks about " : " staged jobs ask about "}
        </span>
        <span className="font-medium">{top.term}</span>
      </p>

      {state.streak > 0 && (
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Flame className="size-3.5 text-primary" strokeWidth={1.75} />
          <span className="font-medium tabular-nums text-foreground">{state.streak}</span>
        </span>
      )}

      <Button asChild size="sm" className="ml-auto">
        <Link href="/prep/round">Three minutes</Link>
      </Button>
    </div>
  );
}
