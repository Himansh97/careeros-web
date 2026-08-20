"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

import { isLiveApi } from "@/lib/api/client";
import { getNews, type NewsItem } from "@/lib/api/news";
import { cn } from "@/lib/utils";

/**
 * A thin strip of what moved in tech and AI today.
 *
 * Three constraints from this codebase shaped the implementation, and each one
 * breaks the obvious version:
 *
 * **A CSS marquee cannot be used.** `globals.css` sets
 * `animation-iteration-count: 1` under `prefers-reduced-motion`, which does not
 * pause an infinite marquee — it makes it run once and stop somewhere arbitrary,
 * leaving the strip frozen mid-headline. Reduced motion here means *no*
 * animation: a plain scrollable row the reader moves themselves.
 *
 * **The React Compiler forbids `setState` in an effect.** The offset is a
 * MotionValue driven by `useAnimationFrame`, so the scroll never triggers a
 * React render. This is the same technique `CountUp` uses in
 * `motion/primitives.tsx`.
 *
 * **The app shell is `h-svh overflow-hidden`** with scrolling on an inner
 * `<main>`. A `fixed` strip would measure from the window edge and sit on top
 * of the sidebar, so this lives in normal flow as a sibling of `<main>`.
 */

const SPEED_PX_PER_SECOND = 42;

const TOPIC_STYLES: Record<string, string> = {
  AI: "text-[--color-chart-1] border-[--color-chart-1]/30",
  Data: "text-[--color-chart-2] border-[--color-chart-2]/30",
  Infra: "text-[--color-chart-3] border-[--color-chart-3]/30",
  Fintech: "text-[--color-chart-4] border-[--color-chart-4]/30",
  Tech: "text-muted-foreground border-border",
};

function Entry({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex shrink-0 items-center gap-2 px-4 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span
        className={cn(
          "rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.12em] uppercase",
          TOPIC_STYLES[item.topic] ?? TOPIC_STYLES.Tech,
        )}
      >
        {item.topic}
      </span>
      <span className="text-sm text-foreground/90 group-hover:text-foreground group-hover:underline">
        {item.title}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">{item.meta}</span>
      <span aria-hidden className="text-muted-foreground/40">
        ·
      </span>
    </a>
  );
}

export function NewsTicker() {
  const reduced = useReducedMotion();
  const { data } = useQuery({
    queryKey: ["news"],
    queryFn: getNews,
    enabled: isLiveApi(),
    // The backend holds per-source TTLs (10 min for Hacker News, 6 h for
    // arXiv), so this only has to be often enough to pick those up.
    refetchInterval: 300_000,
  });

  const x = useMotionValue(0);
  const trackRef = React.useRef<HTMLDivElement>(null);
  // A ref, not state: pausing on hover must not re-render the strip, and the
  // React Compiler would reject setState from the animation path anyway.
  const paused = React.useRef(false);

  useAnimationFrame((_, delta) => {
    if (reduced || paused.current) return;
    const track = trackRef.current;
    if (!track) return;
    // The list is rendered twice, so one full copy is exactly half the track.
    // Wrapping at that point means the seam never lands mid-headline.
    const half = track.scrollWidth / 2;
    if (half <= 0) return;
    const next = x.get() - (SPEED_PX_PER_SECOND * delta) / 1000;
    x.set(next <= -half ? next + half : next);
  });

  const feed = data?.ok ? data.data : null;
  const items = feed?.items ?? [];

  // Quiet when there is nothing to say, like the alerts banner. A permanently
  // empty band is worse than no band.
  if (!feed || items.length === 0) return null;

  const dead = feed.failures.map((f) => feed.sources[f] ?? f);

  return (
    <div
      className="relative border-b border-border bg-card/60"
      role="region"
      aria-label="Recent tech and AI headlines"
    >
      <div
        className={cn(
          "overflow-hidden",
          // Reduced motion turns this into something the reader scrolls.
          reduced && "overflow-x-auto",
        )}
        onMouseEnter={() => {
          paused.current = true;
        }}
        onMouseLeave={() => {
          paused.current = false;
        }}
        // Fade both edges so headlines enter and leave rather than being
        // chopped off at the frame.
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 3rem, black calc(100% - 3rem), transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 3rem, black calc(100% - 3rem), transparent)",
        }}
      >
        <motion.div
          ref={trackRef}
          className="flex w-max items-center whitespace-nowrap"
          style={reduced ? undefined : { x }}
        >
          {items.map((item) => (
            <Entry key={item.id} item={item} />
          ))}
          {/* A second copy so the loop has somewhere to go. Hidden from
              assistive tech, which should hear each headline once. */}
          {!reduced &&
            items.map((item) => (
              <div key={`echo-${item.id}`} aria-hidden>
                <Entry item={item} />
              </div>
            ))}
        </motion.div>
      </div>

      {dead.length > 0 && (
        <div className="border-t border-border/60 px-4 py-1 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
          {dead.join(" · ")} did not answer — those items are missing, not absent
        </div>
      )}
    </div>
  );
}
