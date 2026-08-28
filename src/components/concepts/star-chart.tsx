"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/primitives";
import type { ConceptCard } from "@/lib/api/concepts";

/**
 * The deck drawn as a sky, grouped into constellations by employer.
 *
 * A term's brightness is its Leitner box, so the chart fills with light as the
 * candidate learns — which is the whole reason it is a chart rather than a
 * list. It also makes the shape of the problem visible at a glance: 121 of
 * these terms appear on exactly one claim, and a wall of dim points over one
 * employer says something a table of 158 rows does not.
 *
 * Positions are deterministic, seeded from the term itself, so a star does not
 * wander between renders. A person navigating by "the bright one top-left"
 * needs it to still be there after a reload.
 */

// Box 0 (never seen) through 5 (two months out). Opacity is the only channel
// carrying box, so the chart still reads with colour vision differences; the
// selected ring and the label carry the rest.
const BOX_OPACITY = [0.18, 0.3, 0.45, 0.62, 0.8, 1] as const;

function seededPosition(term: string, index: number) {
  // FNV-1a, so a term always lands in the same place.
  let hash = 2166136261;
  for (let i = 0; i < term.length; i += 1) {
    hash ^= term.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const a = ((hash >>> 0) % 1000) / 1000;
  const b = ((Math.imul(hash, 31) >>> 0) % 1000) / 1000;
  // Nudged onto a loose spiral so points spread rather than clumping in the
  // middle, which is what pure hashing gives you.
  const angle = index * 2.399 + a * 0.6;
  const radius = 0.12 + Math.sqrt(index + 1) * 0.055 + b * 0.05;
  return {
    x: 50 + Math.cos(angle) * radius * 46,
    y: 50 + Math.sin(angle) * radius * 44,
  };
}

export function StarChart({
  cards,
  selected,
  onSelect,
}: {
  cards: ConceptCard[];
  selected: string | null;
  onSelect: (term: string) => void;
}) {
  const safe = useMotionSafe();

  const constellations = React.useMemo(() => {
    const groups = new Map<string, ConceptCard[]>();
    for (const card of cards) {
      const key = card.employers[0] ?? "Unattributed";
      const list = groups.get(key);
      if (list) list.push(card);
      else groups.set(key, [card]);
    }
    // Biggest constellation first, so the eye starts where most of the resume is.
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [cards]);

  return (
    <div className="space-y-4">
      {constellations.map(([employer, group]) => (
        <section
          key={employer}
          className="relative overflow-hidden rounded-lg border border-border bg-card"
          aria-labelledby={`constellation-${employer.replace(/\W+/g, "-")}`}
        >
          <header className="flex items-baseline justify-between border-b border-border px-3 py-2">
            <h3
              id={`constellation-${employer.replace(/\W+/g, "-")}`}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              {employer}
            </h3>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {group.filter((c) => c.box >= 4).length}/{group.length} known
            </span>
          </header>

          <div className="relative h-44 w-full">
            {group.map((card, index) => {
              const { x, y } = seededPosition(card.term, index);
              const isSelected = selected === card.term;
              return (
                <motion.button
                  key={card.term}
                  type="button"
                  onClick={() => onSelect(card.term)}
                  aria-pressed={isSelected}
                  aria-label={`${card.term}, box ${card.box} of ${card.maxBox}${
                    card.due ? ", due" : ""
                  }`}
                  title={`${card.term} — box ${card.box}/${card.maxBox}`}
                  className={cn(
                    "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  animate={
                    safe && card.due && !isSelected
                      ? { scale: [1, 1.35, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    safe && card.due
                      ? { duration: 2.4, repeat: Infinity, delay: (index % 7) * 0.3 }
                      : { duration: 0.15 }
                  }
                >
                  <span
                    className={cn(
                      "block rounded-full bg-foreground transition-all",
                      isSelected ? "size-2.5" : "size-1.5 group-hover:size-2",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                    )}
                    style={{ opacity: BOX_OPACITY[Math.min(card.box, 5)] }}
                  />
                </motion.button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
