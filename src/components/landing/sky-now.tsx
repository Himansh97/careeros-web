"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getSkywatch } from "@/lib/api/skywatch";
import { isLiveApi } from "@/lib/api/client";

/**
 * What is actually happening overhead, right now.
 *
 * Three live feeds — near-Earth approaches from JPL, the planetary K-index
 * from NOAA, and the ISS's current position — polled on the cadence each one
 * deserves. The ISS moves about eight kilometres a second, so its numbers
 * genuinely change between refreshes; the close-approach table for the coming
 * week does not, and pretending otherwise by re-fetching it every five seconds
 * would be theatre.
 *
 * **Missing readings are stated, not hidden.** If NOAA is unreachable the
 * geomagnetic cell says which feed failed rather than showing the last value
 * it happened to have. Live data whose staleness is invisible is worse than a
 * static page, because the timestamp lends it a confidence it has not earned.
 */
export function SkyNow() {
  const live = isLiveApi();
  const { data, isLoading } = useQuery({
    queryKey: ["skywatch"],
    queryFn: getSkywatch,
    enabled: live,
    // The ISS is the reason for this cadence; the backend caches the slower
    // feeds behind their own TTLs so this does not hammer NASA or NOAA.
    refetchInterval: 6000,
    retry: false,
  });

  if (!live) return null;
  const sky = data?.ok ? data.data : null;

  if (isLoading || !sky) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60">
        Acquiring feeds…
      </p>
    );
  }

  const next = sky.approaches?.[0];
  const failed = new Set(sky.failures);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          Live sky
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
          read {sky.readAt.slice(11, 19)} UTC
        </span>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-3">
        {/* ISS — the one that visibly moves between refreshes. */}
        <Cell
          label="ISS position"
          failed={failed.has("iss")}
          feed="wheretheiss.at"
        >
          {sky.iss && (
            <>
              <Value>
                {Math.abs(sky.iss.latitude).toFixed(1)}°
                {sky.iss.latitude >= 0 ? "N" : "S"}{" "}
                {Math.abs(sky.iss.longitude).toFixed(1)}°
                {sky.iss.longitude >= 0 ? "E" : "W"}
              </Value>
              <Note>
                {sky.iss.altitudeKm} km up ·{" "}
                {sky.iss.velocityKmH.toLocaleString()} km/h ·{" "}
                {sky.iss.daylight ? "in daylight" : "in Earth's shadow"}
              </Note>
            </>
          )}
        </Cell>

        {/* Next close approach. */}
        <Cell
          label="Next close approach"
          failed={failed.has("approaches")}
          feed="NASA/JPL CAD"
        >
          {next && (
            <>
              <Value>{next.designation}</Value>
              <Note>
                {next.date} UTC · {next.lunarDistances} lunar distances ·{" "}
                {next.velocityKmS} km/s
              </Note>
            </>
          )}
        </Cell>

        {/* Geomagnetic activity. */}
        <Cell
          label="Geomagnetic"
          failed={failed.has("geomagnetic")}
          feed="NOAA SWPC"
        >
          {sky.geomagnetic && (
            <>
              <Value>Kp {sky.geomagnetic.kp}</Value>
              <Note>
                {sky.geomagnetic.level} · observed{" "}
                {sky.geomagnetic.observedAt.slice(11, 16)} UTC
              </Note>
            </>
          )}
        </Cell>
      </dl>
    </div>
  );
}

function Cell({
  label,
  failed,
  feed,
  children,
}: {
  label: string;
  failed: boolean;
  feed: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1">
        {failed || !children ? (
          <p className="text-sm text-muted-foreground">
            {feed} did not answer. No reading rather than a stale one.
          </p>
        ) : (
          children
        )}
      </dd>
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      // Keyed on the content so it ticks when the value actually changes,
      // which is the ISS most refreshes and the others almost never.
      key={String(children)}
      initial={{ opacity: 0.45 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="font-display text-xl font-semibold tabular-nums text-foreground"
    >
      {children}
    </motion.p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{children}</p>
  );
}
