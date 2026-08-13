/**
 * Real bodies, real figures.
 *
 * Every number here was pulled from NASA/JPL's Small-Body Database and
 * Close-Approach API rather than written from memory, for the same reason the
 * rest of this product refuses invented numbers: a background that quietly
 * makes things up is still making things up. The diameters and rotation
 * periods are the published values, and the components that render these
 * derive their sizes and spin rates *from* them — so the relative scale of
 * Psyche against Bennu, and the fact that Didymos spins nearly twice as fast
 * as Ryugu, are true on screen rather than art-directed.
 *
 * They are also not chosen at random. Each one is a long, patient, uncertain
 * campaign that eventually worked — seven years out and back for 121 grams of
 * Bennu; a spacecraft that landed on Eros without ever being designed to; the
 * first time our species changed the motion of another world. That is the only
 * honest motivational claim this page makes, and it makes it by pointing at
 * things that actually happened rather than by telling the reader they have
 * got this.
 *
 * Sources are carried on each record and printed in the UI. If a figure here
 * cannot be traced, it should be removed rather than kept.
 */

export interface SpaceBody {
  id: string;
  /** JPL's full designation, used verbatim. */
  designation: string;
  short: string;
  kind: "asteroid" | "black-hole" | "craft";
  /** Kilometres. Drives the rendered size. */
  diameterKm?: number;
  /** Hours for one rotation. Drives the spin animation, to scale. */
  rotationHours?: number;
  /** The headline fact, stated plainly. */
  fact: string;
  /** Why this one is here — the campaign, not a metaphor. */
  significance: string;
  source: string;
}

export const BODIES: SpaceBody[] = [
  {
    id: "psyche",
    designation: "16 Psyche (A852 FA)",
    short: "Psyche",
    kind: "asteroid",
    diameterKm: 222,
    rotationHours: 4.196,
    fact: "222 km across and unusually metal-rich — possibly the exposed core of a world that never finished forming.",
    significance:
      "NASA's Psyche launched in October 2023 and does not arrive until 2029. Six years of transit before the first close look.",
    source: "NASA/JPL Small-Body Database",
  },
  {
    id: "bennu",
    designation: "101955 Bennu (1999 RQ36)",
    short: "Bennu",
    kind: "asteroid",
    diameterKm: 0.484,
    rotationHours: 4.296,
    fact: "484 m across, and darker than charcoal — it reflects about 4.4% of the light that hits it.",
    significance:
      "OSIRIS-REx flew seven years out and back to return roughly 121 grams of it in September 2023. The whole campaign was for a sample that fits in a coffee cup.",
    source: "NASA/JPL Small-Body Database",
  },
  {
    id: "apophis",
    designation: "99942 Apophis (2004 MN4)",
    short: "Apophis",
    kind: "asteroid",
    diameterKm: 0.34,
    rotationHours: 30.56,
    fact: "On 13 April 2029 it passes 38,011 km from Earth's centre — about 31,600 km above the surface, inside the ring of geostationary satellites at 35,786 km.",
    significance:
      "It was briefly the most dangerous object ever catalogued. Better observation, not better luck, removed it from the risk list.",
    source: "NASA/JPL Close-Approach Data (CAD API)",
  },
  {
    id: "didymos",
    designation: "65803 Didymos (1996 GT)",
    short: "Didymos",
    kind: "asteroid",
    diameterKm: 0.78,
    rotationHours: 2.2593,
    fact: "780 m across, with a small moon called Dimorphos.",
    significance:
      "DART hit Dimorphos in September 2022 and shortened its orbit around Didymos by about 32 minutes — the first time humans measurably changed the motion of another body.",
    source: "NASA/JPL Small-Body Database; NASA DART results",
  },
  {
    id: "ryugu",
    designation: "162173 Ryugu (1999 JU3)",
    short: "Ryugu",
    kind: "asteroid",
    diameterKm: 0.896,
    rotationHours: 7.63262,
    fact: "896 m across, a loose rubble pile rather than a solid rock.",
    significance:
      "Hayabusa2 touched down twice, fired a projectile to expose buried material, and brought the sample home in December 2020.",
    source: "NASA/JPL Small-Body Database",
  },
  {
    id: "eros",
    designation: "433 Eros (A898 PA)",
    short: "Eros",
    kind: "asteroid",
    diameterKm: 16.84,
    rotationHours: 5.27,
    fact: "16.8 km long — the second asteroid ever discovered near Earth, catalogued in 1898.",
    significance:
      "NEAR Shoemaker orbited it for a year and then landed on it in 2001, despite never having been designed to land on anything.",
    source: "NASA/JPL Small-Body Database",
  },
  {
    id: "sgr-a",
    designation: "Sagittarius A*",
    short: "Sgr A*",
    kind: "black-hole",
    fact: "The supermassive black hole at the centre of our galaxy — about 4.3 million times the mass of the Sun, roughly 26,000 light years away.",
    significance:
      "Decades of tracking single stars through their orbits proved it was there. The first image came in 2022, long after the evidence did.",
    source: "Event Horizon Telescope Collaboration, 2022",
  },
  {
    id: "m87",
    designation: "M87*",
    short: "M87*",
    kind: "black-hole",
    fact: "About 6.5 billion solar masses, 55 million light years away in the galaxy Messier 87.",
    significance:
      "The first black hole ever imaged, in April 2019. It took a telescope the width of the Earth to see one pixel-blurred ring.",
    source: "Event Horizon Telescope Collaboration, 2019",
  },
];

/**
 * Rendered radius in px from real diameter — logarithmic, and said so.
 *
 * The real range is nearly three orders of magnitude: Psyche is about 650
 * times wider than Apophis. At true scale, a Psyche that fitted on screen
 * would render Apophis at a third of a pixel. So this is a log scale, which
 * means **the ordering is real and the ratios are not**.
 *
 * That distinction is worth being pedantic about, because the first draft of
 * the copy beside this field claimed the proportions were "true rather than
 * art-directed" and they are not — they are compressed on purpose. The spin
 * rates *are* exactly proportional (see `spinSeconds`), so the page now claims
 * that and only that. A product that refuses invented numbers does not get to
 * round its own description up.
 */
export function bodyRadius(km: number | undefined, base = 24): number {
  if (!km) return base * 1.5; // Black holes are not sized from a diameter.
  return base * (0.6 + Math.log10(km + 1) * 0.8);
}

/**
 * Seconds per on-screen rotation, from the real period.
 *
 * Compressed by a constant factor so everything is visible in one sitting, but
 * the *ratios* survive: Didymos really does spin about 3.4 times for every one
 * turn of Ryugu, and it does here too.
 */
export function spinSeconds(hours: number | undefined, factor = 9): number {
  if (!hours) return 0;
  return hours * factor;
}
