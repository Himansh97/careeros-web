"use client";

/**
 * The crew figure, drawn as a technical illustration.
 *
 * Deliberately a flat line drawing: no gradients, no shading, no rendering.
 * The identity this app committed to is the 1975 NASA Graphics Standards
 * Manual — printed, precise, unfussy — and a photoreal astronaut would be the
 * opposite register. A schematic figure *is* the aesthetic; a glossy character
 * would fight it, which is the reason this is SVG rather than three.js and not
 * merely the bundle cost.
 *
 * It is also not a mascot. In the frame this product uses, mission control
 * advises and the crew flies — so the figure is the candidate, and its position
 * on the tether reports how far through the review they are. It has a job.
 *
 * `currentColor` throughout, so it inherits the theme rather than carrying its
 * own palette: paper-and-ink in light, instrument phosphor in dark.
 */
export function EvaFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 96"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // Decorative here: the tether it sits on is labelled, and the readouts
      // beside it carry the meaning. Announcing "astronaut" to a screen reader
      // would add noise, not information.
      aria-hidden="true"
    >
      {/* Life-support pack */}
      <rect x="20" y="26" width="24" height="26" rx="3" />
      <path d="M24 32h16M24 38h16" strokeOpacity={0.45} />

      {/* Helmet, with the visor left open as a shape rather than a shine */}
      <circle cx="32" cy="16" r="11" />
      <path d="M25 13a7 7 0 0 1 14 0v3a7 7 0 0 1-14 0z" strokeOpacity={0.55} />

      {/* Neck ring — the detail that reads as a real suit rather than a doodle */}
      <path d="M27 26h10" />

      {/* Arms, one raised as if working a handhold */}
      <path d="M20 30 8 22M8 22l-3-5" />
      <path d="M44 32l11 9M55 41l5 2" />

      {/* Legs */}
      <path d="M25 52l-3 18M22 70l-4 8" />
      <path d="M39 52l3 18M42 70l4 8" />

      {/* Tether anchor at the pack — where the line attaches */}
      <circle cx="32" cy="52" r="2" strokeOpacity={0.6} />
    </svg>
  );
}
