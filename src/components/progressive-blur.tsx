"use client";

/**
 * A blur that ramps rather than switches.
 *
 * A single `backdrop-filter` strip has a hard boundary — content is sharp, then
 * abruptly is not, and the edge of the strip is more visible than the effect.
 * Progressive blur stacks several strips instead: each one blurrier than the
 * last, each masked to reach less far from the edge. Because a backdrop-filter
 * applies to everything painted beneath it, including the previous layers, the
 * region nearest the edge receives every layer's blur and the far region
 * receives only the first. The result is a smooth ramp with no seam anywhere.
 *
 * Used at the top and bottom of the review so the page dissolves at the frame
 * rather than being cut off by it, which is what makes the scroll read as a
 * window onto something continuous instead of a document with ends.
 *
 * The layer count is six. Fewer and the ramp bands visibly; more costs another
 * full-width compositing pass for a difference nobody can see.
 */
const LAYERS = 6;

export function ProgressiveBlur({
  side,
  /** Strip depth. Tailwind sizing is avoided here — the mask math needs px. */
  height = 140,
  className,
}: {
  side: "top" | "bottom";
  height?: number;
  className?: string;
}) {
  // The mask runs from the anchored edge inward, so the gradient direction is
  // the opposite of the side it is pinned to.
  const direction = side === "top" ? "to bottom" : "to top";

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 ${
        side === "top" ? "top-0" : "bottom-0"
      } ${className ?? ""}`}
      style={{ height }}
      aria-hidden="true"
    >
      {Array.from({ length: LAYERS }, (_, i) => {
        // Blur doubles per layer; the mask window shrinks toward the edge by
        // the same fraction each time, so the two ramps stay in step.
        const blur = 2 ** i;
        const reach = 100 - (i * 100) / LAYERS;
        const solid = reach - 100 / LAYERS;
        const mask = `linear-gradient(${direction}, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${Math.max(
          solid,
          0
        )}%, rgba(0,0,0,0) ${reach}%)`;

        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
