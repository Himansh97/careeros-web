"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getRegions, setRegion } from "@/lib/api/regions";

/**
 * Which market discovery is pointed at.
 *
 * Not a filter over one pool. Switching region changes which sources the
 * server reads and invalidates its snapshot, so the job list genuinely
 * changes rather than being narrowed.
 *
 * A region the server reports as unconfigured is shown and disabled rather
 * than hidden. Hiding it would leave someone wondering whether India is
 * supported; showing it greyed out with the reason says what is missing and
 * what would fix it. That is the same choice the not-connected states make
 * elsewhere: an honest empty beats a plausible wrong answer, and India
 * without the aggregator would return US employers under an India heading.
 */
export function RegionToggle() {
  const queryClient = useQueryClient();

  const state = useQuery({
    queryKey: ["regions"],
    queryFn: getRegions,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const choose = useMutation({
    mutationFn: (region: string) => setRegion(region),
    onSuccess: (res) => {
      if (!res.ok) return;
      // The pool on the server is gone, so everything derived from it is stale.
      void queryClient.invalidateQueries({ queryKey: ["regions"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
  });

  const data = state.data?.ok ? state.data.data : undefined;
  if (!data || data.regions.length < 2) return null;

  const failed = choose.data && !choose.data.ok ? choose.data : undefined;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <TooltipProvider delayDuration={200}>
        <div
          role="group"
          aria-label="Job market"
          className="flex items-center rounded-md border border-border p-0.5"
        >
          <Globe
            className="mx-1.5 size-3.5 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
          {data.regions.map((region) => {
            const active = region.id === data.active;
            const pending = choose.isPending && choose.variables === region.id;
            const button = (
              <Button
                key={region.id}
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                disabled={!region.configured || choose.isPending}
                className={cn("h-7 gap-1.5 px-2.5 text-xs", active && "font-medium")}
                onClick={() => {
                  if (!active && region.configured) choose.mutate(region.id);
                }}
              >
                {pending ? (
                  <Loader2 className="size-3 animate-spin" strokeWidth={1.75} />
                ) : !region.configured ? (
                  <Lock className="size-3" strokeWidth={1.75} aria-hidden />
                ) : null}
                {region.label}
              </Button>
            );

            if (region.configured) return button;
            return (
              <Tooltip key={region.id}>
                {/* A disabled button fires no pointer events, so the trigger
                    needs its own wrapper or the explanation never appears. */}
                <TooltipTrigger asChild>
                  <span tabIndex={0}>{button}</span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Needs <code>{region.requires}</code> in the API&rsquo;s{" "}
                  <code>.env</code>. Without it this would show the direct job
                  boards, which are US employers, under a {region.label} heading.
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {failed && (
        <p className="text-xs text-destructive">
          {failed.message ?? "could not switch market"}
        </p>
      )}
    </div>
  );
}
