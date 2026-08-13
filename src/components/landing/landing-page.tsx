"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { StarLayers } from "@/components/landing/star-layers";
import { ShootingStars } from "@/components/landing/shooting-stars";
import { SkyNow } from "@/components/landing/sky-now";
import { OrbitalField } from "@/components/landing/orbital-field";
import { EvaFigure } from "@/components/review/eva-figure";
import { CountUp } from "@/components/motion/primitives";
import { listAlerts } from "@/lib/api/ops";
import { isLiveApi } from "@/lib/api/client";
import { BODIES, type SpaceBody } from "@/lib/space-objects";

/**
 * The front door.
 *
 * There was not one — `/` ran the pre-flight poll and handed off to the
 * dashboard, so the product opened mid-sentence. This is the page before that,
 * and the poll is now what the primary action launches, which is the order the
 * metaphor always implied: you read the board, then you commit.
 *
 * It follows the shape of a marketing page — hero, numbered capabilities,
 * module grid, closing call — but keeps this product's register rather than
 * the one that genre reaches for. No cyan, no glow, no "Commander". The
 * identity is the 1975 NASA Graphics Standards Manual: flat red, mono labels,
 * technical line drawings. That is a narrower choice than sci-fi HUD precisely
 * because it is a real one.
 *
 * **The status strip is live or absent.** It reads the same endpoint the app
 * reads. If the backend is not up it renders nothing at all rather than
 * plausible zeros, which is the same rule every screen here follows: a wrong
 * number is worse than no number, and it is worse on the front page than
 * anywhere else.
 */
export function LandingPage() {
  const live = isLiveApi();
  const alerts = useQuery({
    queryKey: ["alerts", "landing"],
    queryFn: listAlerts,
    enabled: live,
    retry: false,
  });
  const funnel = alerts.data?.ok ? alerts.data.data.funnel : null;

  const [selected, setSelected] = React.useState<SpaceBody>(
    BODIES.find((b) => b.id === "apophis") ?? BODIES[0]
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <StarLayers />
      <ShootingStars />

      <Nav />

      {/* ---------------------------------------------------------------- */}
      {/* 01 — Mission control. First, as it should be.                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
          Mission control for one job search
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-6xl font-semibold leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">
          Your career,
          <br />
          <span className="text-primary">flown properly.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Every application is scored against your own evidence, held to launch
          commit criteria, and released only by you. Nothing is submitted
          automatically and no number on this page was invented.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/launch"
            className="rounded-md bg-primary px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Begin pre-flight
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Resume session
          </Link>
        </div>

        {/* Live, or nothing. Never zeros that look like findings. */}
        {funnel && (
          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-4">
            <Stat value={funnel.tracked} label="tracked" />
            <Stat value={funnel.submitted} label="submitted" />
            <Stat value={funnel.responded} label="responses" />
            <Stat value={funnel.interviews} label="interviews" />
            <p className="col-span-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 sm:col-span-4">
              Read live from this system · {funnel.note}
            </p>
          </dl>
        )}
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 02 — The sector. Real objects, real figures.                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
            02 · The sector
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything out here is real, and so is everything in the app.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every body here is real and every figure comes from NASA/JPL.
            They spin at their true relative rates — Didymos really does turn
            about 3.4 times for each rotation of Ryugu. Their sizes are ordered
            correctly but log-scaled, not proportional: Psyche is 650 times
            wider than Apophis, and at true scale Apophis would be a third of a
            pixel. Select one. The same rule that governs this background
            governs every score in the product, including being precise about
            what it is not: if a figure cannot be traced, it does not get shown.
          </p>
        </div>

        <div className="relative h-[560px] border-y border-border sm:h-[620px]">
          <OrbitalField onSelect={setSelected} selectedId={selected.id} />
        </div>

        {/* Live feeds, directly beneath the field of catalogued bodies — the
            static ones above are where things are, this is what they are
            doing right now. */}
        <div className="mx-auto max-w-6xl border-b border-border px-6 py-10">
          <SkyNow />
        </div>

        {/* The readout for whichever body is selected. */}
        <div className="mx-auto max-w-6xl px-6 py-10">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            className="grid gap-6 lg:grid-cols-[1fr_1fr]"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {selected.kind === "black-hole" ? "Black hole" : "Small body"}
              </p>
              <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                {selected.designation}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {selected.fact}
              </p>
              {(selected.diameterKm || selected.rotationHours) && (
                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {selected.diameterKm && (
                    <span>
                      Diameter{" "}
                      <span className="text-foreground">
                        {selected.diameterKm < 1
                          ? `${Math.round(selected.diameterKm * 1000)} m`
                          : `${selected.diameterKm} km`}
                      </span>
                    </span>
                  )}
                  {selected.rotationHours && (
                    <span>
                      Rotation{" "}
                      <span className="text-foreground">
                        {selected.rotationHours} h
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="border-l-2 border-primary/40 pl-5">
              <p className="text-sm leading-relaxed text-foreground">
                {selected.significance}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                Source · {selected.source}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 03 — What it actually does.                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
            03 · Installed systems
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Four things, each of which refuses to guess.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <Capability key={c.title} {...c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* 04 — Close.                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 py-24 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
              04 · Final transmission
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Seven years out and back for 121 grams.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              That was OSIRIS-REx at Bennu, and it is the only encouragement
              this page offers: the campaigns that worked were long, and they
              were run on instruments that told the truth.
            </p>
            <Link
              href="/launch"
              className="mt-7 inline-block rounded-md bg-primary px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Begin pre-flight
            </Link>
          </div>
          <span className="hidden w-28 shrink-0 text-primary sm:block">
            <EvaFigure className="h-36 w-full" animate />
          </span>
        </div>
      </section>

      <footer className="relative border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="text-foreground">CareerOS</span>
          <span>Small-body figures · NASA/JPL Small-Body Database</span>
        </div>
      </footer>
    </div>
  );
}

function Nav() {
  return (
    <nav className="relative z-10 border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <span className="flex items-center gap-2.5">
          <span className="w-5 text-primary">
            <EvaFigure className="h-6 w-full" animate />
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            CareerOS
          </span>
        </span>
        <Link
          href="/dashboard"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open the deck
        </Link>
      </div>
    </nav>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dd className="font-display text-3xl font-semibold tabular-nums">
        <CountUp value={value} />
      </dd>
      <dt className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
    </div>
  );
}

/** Real behaviour, described in the terms the code actually enforces. */
const CAPABILITIES = [
  {
    tag: "Mod.01",
    title: "Discovery that admits its limits",
    body: "Sweeps live boards and prints how many of the results it actually scored. A ranked list built from a fraction is reported as exactly that.",
  },
  {
    tag: "Mod.02",
    title: "Scoring against your own evidence",
    body: "Deterministic, no model in the loop. An unrecognised requirement counts as a gap, never as a pass — not knowing a term is not a reason to assume you meet it.",
  },
  {
    tag: "Mod.03",
    title: "Launch commit criteria",
    body: "Eligibility, posting, fit, resume and evidence are polled separately. Any single NO-GO holds the application, whatever the other numbers say.",
  },
  {
    tag: "Mod.04",
    title: "Nothing auto-submits",
    body: "Documents, outreach and pre-filled forms are prepared and staged. The last action is yours, structurally — there is no flag that overrides it.",
  },
];

function Capability({
  tag,
  title,
  body,
  index,
}: {
  tag: string;
  title: string;
  body: string;
  index: number;
}) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      className="bg-background p-7"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={reduced || inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, delay: reduced ? 0 : index * 0.06 }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {tag}
      </p>
      <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </motion.div>
  );
}
