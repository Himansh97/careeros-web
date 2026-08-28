"use client";

import { ArrowRight, ArrowDown, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConceptVisual } from "@/lib/api/concepts";

/**
 * The picture on a concept card, drawn from a small closed vocabulary.
 *
 * Four shapes — flow, layers, compare, cycle — cover most technical concepts,
 * and the closed set is the point rather than a limitation. Having to decide
 * which shape a concept is forces it to be understood; and every card then
 * renders in the app's own type and colours instead of being 158 unrelated
 * pictures pasted in.
 *
 * Built from divs and borders like the rest of this codebase, which has no
 * charting dependency anywhere and draws its own SVG when it needs one. A
 * diagram stored as data is also a diagram you can correct with an UPDATE
 * rather than by redrawing an asset.
 */

function Node({
  label,
  note,
  index,
  tone = "default",
}: {
  label: string;
  note?: string;
  index?: number;
  tone?: "default" | "muted";
}) {
  return (
    <div
      className={cn(
        "flex-1 rounded-md border p-2.5",
        tone === "muted"
          ? "border-border bg-muted/40"
          : "border-primary/25 bg-primary/[0.04]",
      )}
    >
      <div className="flex items-baseline gap-1.5">
        {index !== undefined && (
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
      </div>
      {note && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

export function ConceptDiagram({ visual }: { visual: ConceptVisual }) {
  const { kind, nodes, caption } = visual;

  return (
    <figure className="rounded-lg border border-border bg-card/60 p-3">
      {kind === "flow" && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
          {nodes.map((node, i) => (
            <div key={node.label} className="flex flex-1 items-center gap-1.5">
              <Node label={node.label} note={node.note} index={i} />
              {i < nodes.length - 1 && (
                <>
                  <ArrowRight
                    className="hidden size-3.5 shrink-0 text-muted-foreground sm:block"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <ArrowDown
                    className="size-3.5 shrink-0 text-muted-foreground sm:hidden"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {kind === "layers" && (
        // Top to bottom, cheapest or highest-level first. Indented so the
        // stacking is visible without needing a legend.
        <div className="space-y-1.5">
          {nodes.map((node, i) => (
            <div key={node.label} style={{ paddingLeft: `${i * 12}px` }}>
              <Node label={node.label} note={node.note} index={i} />
            </div>
          ))}
        </div>
      )}

      {kind === "compare" && (
        <div className="grid gap-1.5 sm:grid-cols-3">
          {nodes.map((node, i) => (
            <Node
              key={node.label}
              label={node.label}
              note={node.note}
              tone={i === nodes.length - 1 && nodes.length === 3 ? "muted" : "default"}
            />
          ))}
        </div>
      )}

      {kind === "cycle" && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
          {nodes.map((node, i) => (
            <div key={node.label} className="flex flex-1 items-center gap-1.5">
              <Node label={node.label} note={node.note} index={i} />
              {i < nodes.length - 1 ? (
                <ArrowRight
                  className="hidden size-3.5 shrink-0 text-muted-foreground sm:block"
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : (
                <RotateCw
                  className="hidden size-3.5 shrink-0 text-primary sm:block"
                  strokeWidth={1.75}
                  aria-label="returns to the start"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {caption && (
        <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {kind === "cycle" ? `${caption} · repeats` : caption}
        </figcaption>
      )}
    </figure>
  );
}
