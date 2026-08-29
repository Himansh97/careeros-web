"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useMotionSafe } from "@/components/motion/primitives";

/**
 * Diagrams that carry meaning in a visual channel rather than in a box.
 *
 * The first version of this drew four bordered rectangles in a row and called
 * it a flow. That is a list laid out sideways: everything was in the text, and
 * the picture added nothing you would not have got from reading. A diagram
 * earns its space only when position, length, area, intensity or connection is
 * doing work the words cannot.
 *
 * So the shapes here are chosen because each one has a channel:
 *
 * - `fanout`   — lines diverging. You SEE one row become three, which is the
 *                single most important idea in SQL and the hardest to say.
 * - `heatmap`  — opacity is the value. Attention weights and confusion
 *                matrices are read at a glance instead of parsed.
 * - `curve`    — plotted paths, with the gap between two lines shaded, because
 *                on a bias-variance chart the gap IS the diagnosis.
 * - `sets`     — overlapping circles with the selected region filled. Join
 *                types stop needing a paragraph.
 * - `bars`     — length is the quantity. For anything with magnitude.
 * - `flow` / `layers` / `compare` / `cycle` — kept, but drawn: real
 *                connectors, indentation that means nesting, a ring that
 *                closes.
 *
 * Everything is hand-built SVG using `currentColor` and theme tokens, so it
 * reads in both themes and needs no charting dependency — consistent with a
 * codebase that draws its own starfields.
 */

export type DiagramNode = {
  label: string;
  note?: string;
  tone?: "good" | "bad" | "neutral";
  value?: number;
};

export type DiagramSpec =
  | { kind: "fanout"; caption?: string; nodes: DiagramNode[]; factor?: number }
  | { kind: "heatmap"; caption?: string; rows: string[]; cols: string[]; cells: DiagramNode[] }
  | {
      kind: "curve";
      caption?: string;
      xLabel?: string;
      yLabel?: string;
      series: { label: string; points: [number, number][]; tone?: "good" | "bad" | "neutral" }[];
      shadeGap?: boolean;
    }
  | { kind: "sets"; caption?: string; left: string; right: string; fill: ("left" | "both" | "right")[] }
  | { kind: "bars"; caption?: string; nodes: DiagramNode[]; unit?: string }
  | { kind: "flow" | "layers" | "compare" | "cycle"; caption?: string; nodes: DiagramNode[] };

const TONE_STROKE: Record<string, string> = {
  good: "stroke-success",
  bad: "stroke-destructive",
  neutral: "stroke-primary",
};
const TONE_TEXT: Record<string, string> = {
  good: "text-success",
  bad: "text-destructive",
  neutral: "text-foreground",
};

function Frame({
  caption,
  children,
}: {
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="rounded-lg border border-border bg-card/60 p-3">
      <div className="overflow-x-auto">{children}</div>
      {caption && (
        <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* -------------------------------------------------------------- fanout ---- */
/** One row becoming many. The lines are the point. */
function Fanout({ nodes, factor = 3 }: { nodes: DiagramNode[]; factor?: number }) {
  const safe = useMotionSafe();
  const [parent, ...children] = nodes;
  const rows = Math.max(2, Math.min(6, factor));
  const h = rows * 26 + 20;

  return (
    <svg viewBox={`0 0 320 ${h}`} className="h-auto w-full max-w-md" role="img"
         aria-label={`One ${parent?.label ?? "row"} expanding into ${rows}`}>
      <rect x="4" y={h / 2 - 13} width="96" height="26" rx="4"
            className="fill-primary/10 stroke-primary/40" strokeWidth="1" />
      <text x="52" y={h / 2 + 4} textAnchor="middle"
            className="fill-foreground text-[11px]">{parent?.label ?? "parent"}</text>

      {Array.from({ length: rows }).map((_, i) => {
        const y = 16 + i * 26;
        return (
          <g key={i}>
            <motion.path
              d={`M100 ${h / 2} C 140 ${h / 2}, 160 ${y + 13}, 200 ${y + 13}`}
              className="stroke-muted-foreground/50" strokeWidth="1" fill="none"
              initial={safe ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: safe ? i * 0.08 : 0 }}
            />
            <rect x="200" y={y} width="112" height="26" rx="4"
                  className="fill-destructive/10 stroke-destructive/30" strokeWidth="1" />
            <text x="256" y={y + 17} textAnchor="middle"
                  className="fill-foreground text-[11px]">
              {children[i]?.label ?? `${parent?.label ?? "row"} ${i + 1}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------- heatmap ---- */
/** Opacity is the value, so the shape is read before the numbers. */
function Heatmap({
  rows,
  cols,
  cells,
}: {
  rows: string[];
  cols: string[];
  cells: DiagramNode[];
}) {
  const values = cells.map((c) => c.value ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="min-w-fit">
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `minmax(72px,auto) repeat(${cols.length}, minmax(64px,1fr))` }}
      >
        <div />
        {cols.map((c) => (
          <div key={c} className="px-1 pb-1 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
            {c}
          </div>
        ))}
        {rows.map((r, ri) => (
          <React.Fragment key={r}>
            <div className="flex items-center pr-2 text-right font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              {r}
            </div>
            {cols.map((c, ci) => {
              const cell = cells[ri * cols.length + ci];
              const intensity = (cell?.value ?? 0) / max;
              return (
                <div
                  key={c}
                  title={cell?.note}
                  className={cn(
                    "rounded-sm px-1.5 py-2 text-center",
                    cell?.tone === "good" && "bg-success/10",
                    cell?.tone === "bad" && "bg-destructive/10",
                  )}
                  style={
                    cell?.value !== undefined
                      ? { backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(intensity * 70)}%, transparent)` }
                      : undefined
                  }
                >
                  <div className={cn("text-xs font-medium tabular-nums", TONE_TEXT[cell?.tone ?? "neutral"])}>
                    {cell?.label}
                  </div>
                  {cell?.note && (
                    <div className="mt-0.5 text-[9px] leading-tight text-muted-foreground">{cell.note}</div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- curve ---- */
/** Real paths. The shaded gap between two series is usually the whole message. */
function Curve({
  series,
  xLabel,
  yLabel,
  shadeGap,
}: {
  series: { label: string; points: [number, number][]; tone?: "good" | "bad" | "neutral" }[];
  xLabel?: string;
  yLabel?: string;
  shadeGap?: boolean;
}) {
  const safe = useMotionSafe();
  const W = 300, H = 140, P = 24;
  const sx = (x: number) => P + x * (W - P * 2);
  const sy = (y: number) => H - P - y * (H - P * 2);
  const path = (pts: [number, number][]) =>
    pts.map(([x, y], i) => `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join(" ");

  const gap =
    shadeGap && series.length >= 2
      ? `${path(series[0].points)} L ${[...series[1].points].reverse().map(([x, y]) => `${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join(" L ")} Z`
      : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-md" role="img"
           aria-label={series.map((s) => s.label).join(" versus ")}>
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} className="stroke-border" strokeWidth="1" />
        <line x1={P} y1={P} x2={P} y2={H - P} className="stroke-border" strokeWidth="1" />

        {gap && <path d={gap} className="fill-destructive/10" />}

        {series.map((s, i) => (
          <motion.path
            key={s.label}
            d={path(s.points)}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            className={TONE_STROKE[s.tone ?? "neutral"]}
            initial={safe ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: safe ? i * 0.15 : 0 }}
          />
        ))}

        {xLabel && (
          <text x={W / 2} y={H - 4} textAnchor="middle"
                className="fill-muted-foreground text-[9px] uppercase tracking-wider">{xLabel}</text>
        )}
        {yLabel && (
          <text x={8} y={H / 2} textAnchor="middle" transform={`rotate(-90 8 ${H / 2})`}
                className="fill-muted-foreground text-[9px] uppercase tracking-wider">{yLabel}</text>
        )}
      </svg>

      <div className="mt-1 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("h-0.5 w-4 rounded-full",
              s.tone === "good" ? "bg-success" : s.tone === "bad" ? "bg-destructive" : "bg-primary")} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sets ---- */
/** Which region is filled is the entire definition of a join. */
function Sets({ left, right, fill }: { left: string; right: string; fill: string[] }) {
  const on = (r: string) => fill.includes(r);
  return (
    <svg viewBox="0 0 260 110" className="h-auto w-full max-w-xs" role="img"
         aria-label={`${left} and ${right}, with ${fill.join(" and ")} selected`}>
      <defs>
        <clipPath id="clipL"><circle cx="100" cy="52" r="42" /></clipPath>
        <clipPath id="clipR"><circle cx="160" cy="52" r="42" /></clipPath>
      </defs>
      {on("left") && <circle cx="100" cy="52" r="42" className="fill-primary/25" />}
      {on("right") && <circle cx="160" cy="52" r="42" className="fill-primary/25" />}
      {on("both") && (
        <g clipPath="url(#clipL)">
          <circle cx="160" cy="52" r="42" className="fill-primary/45" />
        </g>
      )}
      <circle cx="100" cy="52" r="42" className="fill-none stroke-border" strokeWidth="1.5" />
      <circle cx="160" cy="52" r="42" className="fill-none stroke-border" strokeWidth="1.5" />
      <text x="66" y="104" textAnchor="middle" className="fill-muted-foreground text-[10px]">{left}</text>
      <text x="194" y="104" textAnchor="middle" className="fill-muted-foreground text-[10px]">{right}</text>
    </svg>
  );
}

/* ---------------------------------------------------------------- bars ---- */
/** Length is the quantity. Nothing else needs to be said. */
function Bars({ nodes, unit }: { nodes: DiagramNode[]; unit?: string }) {
  const safe = useMotionSafe();
  const max = Math.max(...nodes.map((n) => n.value ?? 0), 1);
  return (
    <div className="space-y-1.5">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-right text-[11px] text-muted-foreground">
            {n.label}
          </span>
          <div className="h-4 flex-1 rounded-sm bg-muted/50">
            <motion.div
              className={cn("h-4 rounded-sm",
                n.tone === "good" ? "bg-success/60" : n.tone === "bad" ? "bg-destructive/60" : "bg-primary/60")}
              initial={safe ? { width: 0 } : false}
              animate={{ width: `${((n.value ?? 0) / max) * 100}%` }}
              transition={{ duration: 0.5, delay: safe ? i * 0.06 : 0 }}
            />
          </div>
          <span className="w-14 shrink-0 font-mono text-[11px] tabular-nums text-foreground">
            {n.value}{unit ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------- flow / layers / ... --- */
function Boxes({
  kind,
  nodes,
}: {
  kind: "flow" | "layers" | "compare" | "cycle";
  nodes: DiagramNode[];
}) {
  const safe = useMotionSafe();
  const sequenced = kind === "flow" || kind === "cycle";

  return (
    <div
      className={cn(
        kind === "layers" ? "space-y-1.5" : "flex flex-col gap-1.5 sm:flex-row sm:items-stretch",
      )}
    >
      {nodes.map((node, i) => (
        <React.Fragment key={node.label}>
          <motion.div
            initial={safe ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: safe ? i * 0.07 : 0 }}
            style={kind === "layers" ? { marginLeft: i * 14 } : undefined}
            className={cn(
              "flex-1 rounded-md border p-2.5",
              node.tone === "good" && "border-success/40 bg-success/5",
              node.tone === "bad" && "border-destructive/40 bg-destructive/5",
              (!node.tone || node.tone === "neutral") && "border-primary/25 bg-primary/[0.04]",
            )}
          >
            <div className="flex items-baseline gap-1.5">
              {sequenced && (
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span className="text-sm font-medium leading-snug text-foreground">{node.label}</span>
            </div>
            {node.note && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{node.note}</p>
            )}
          </motion.div>

          {sequenced && i < nodes.length - 1 && (
            <span aria-hidden className="hidden shrink-0 self-center text-muted-foreground sm:block">
              →
            </span>
          )}
          {kind === "cycle" && i === nodes.length - 1 && (
            <span aria-label="returns to the start"
                  className="hidden shrink-0 self-center text-primary sm:block">↻</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function Diagram({ spec }: { spec: DiagramSpec }) {
  return (
    <Frame caption={spec.caption}>
      {spec.kind === "fanout" && <Fanout nodes={spec.nodes} factor={spec.factor} />}
      {spec.kind === "heatmap" && <Heatmap rows={spec.rows} cols={spec.cols} cells={spec.cells} />}
      {spec.kind === "curve" && (
        <Curve series={spec.series} xLabel={spec.xLabel} yLabel={spec.yLabel} shadeGap={spec.shadeGap} />
      )}
      {spec.kind === "sets" && <Sets left={spec.left} right={spec.right} fill={spec.fill} />}
      {spec.kind === "bars" && <Bars nodes={spec.nodes} unit={spec.unit} />}
      {(spec.kind === "flow" || spec.kind === "layers" || spec.kind === "compare" || spec.kind === "cycle") && (
        <Boxes kind={spec.kind} nodes={spec.nodes} />
      )}
    </Frame>
  );
}
