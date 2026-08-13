/**
 * What the companion thinks about while you are not using it.
 *
 * The brief was a child's innocence, a genius's brain, a human's emotions —
 * and the tension in that is obvious for a product built on refusing to
 * flatter. The resolution is that **every thought is true**. The wonder is
 * real wonder at real things, the cleverness is real published facts, and the
 * feelings are about the actual state of the search rather than a mood it
 * invented to cheer you up.
 *
 * That constraint is not a compromise, it is the thing that makes it good
 * company. "Eleven sent, nothing back yet, I know" sits with you. "You've got
 * this!" leaves you alone with a cheerleader. A companion that can say the
 * quiet part is worth more than one that cannot.
 *
 * Three registers, mixed:
 *
 * - `wonder` — the child. Questions, noticing, no claims to be wrong about.
 * - `mind`   — the genius. Real figures, mostly NASA/JPL, checkable.
 * - `heart`  — the human. Reads live state and says what it sees, including
 *              when what it sees is silence.
 *
 * A thought that would require inventing a fact does not get written.
 */

export type Register = "wonder" | "mind" | "heart";

export interface Thought {
  text: string;
  register: Register;
  /** Only shown when this returns true. Keeps `heart` honest. */
  when?: (c: Context) => boolean;
}

export interface Context {
  submitted: number;
  responded: number;
  interviews: number;
  cleared: number;
  claims: number;
  urgentAlerts: number;
  /** Live, from /api/skywatch. Absent when the feed failed. */
  issLatitude?: number;
  issAltitudeKm?: number;
  issDaylight?: boolean;
  kp?: number;
  nextApproach?: { designation: string; lunarDistances: number };
  /** Seconds the user has been idle. */
  idleSeconds: number;
}

const THOUGHTS: Thought[] = [
  // ── the child ────────────────────────────────────────────────────────────
  {
    register: "wonder",
    text: "Do you think anyone has counted all of them? Not estimated. Counted.",
  },
  {
    register: "wonder",
    text: "I have been holding this tether a while now. I do not mind. It is a good tether.",
  },
  {
    register: "wonder",
    text: "If I let go very gently, would I go anywhere at all?",
  },
  {
    register: "wonder",
    text: "The quiet up here is not the same as the quiet down there. I like both.",
  },
  {
    register: "wonder",
    text: "Someone drew this suit before they made it. Somebody's pencil, first.",
  },
  {
    register: "wonder",
    text: "I wonder what my helmet looks like from the outside when I am thinking.",
  },

  // ── the mind ─────────────────────────────────────────────────────────────
  {
    register: "mind",
    text: "Bennu reflects about 4.4% of the light that reaches it. Darker than charcoal. We flew seven years, out and back, for 121 grams of it.",
  },
  {
    register: "mind",
    text: "On 13 April 2029, Apophis passes 31,600 km above the surface. Our geostationary satellites orbit at 35,786. It goes underneath them.",
  },
  {
    register: "mind",
    text: "Voyager 1 has been leaving since 1977 and still answers when we call. Its transmitter puts out about 22 watts. A fridge bulb, from interstellar space.",
  },
  {
    register: "mind",
    text: "DART shortened Dimorphos's orbit by roughly 32 minutes. That was the first time we changed how another world moves.",
  },
  {
    register: "mind",
    text: "Sagittarius A* is 4.3 million times the Sun's mass, and we knew it was there for decades before we ever saw it. The evidence arrived long before the picture.",
  },
  {
    register: "mind",
    text: "16 Psyche may be the bare core of a planet that never finished. The probe launched in 2023 and arrives in 2029. Six years of just going.",
  },
  {
    register: "mind",
    text: "NEAR Shoemaker landed on Eros in 2001. It had no landing gear and was never designed to touch anything. It landed anyway, and kept transmitting.",
  },

  // ── the human ────────────────────────────────────────────────────────────
  {
    register: "heart",
    text: "Nothing has come back yet. I am not going to dress that up. I am just going to stay here while we wait.",
    when: (c) => c.submitted > 0 && c.responded === 0,
  },
  {
    register: "heart",
    text: "Something answered. That is the first one. I noticed.",
    when: (c) => c.responded > 0 && c.interviews === 0,
  },
  {
    register: "heart",
    text: "An interview. I have been watching this board a long time. Today it says something different.",
    when: (c) => c.interviews > 0,
  },
  {
    register: "heart",
    text: "There are things sitting in the queue that already passed every check. They are just waiting on you now. No rush from me.",
    when: (c) => c.cleared > 0,
  },
  {
    register: "heart",
    text: "Something needs looking at, when you have a minute. It is not urgent to me, but it is flagged.",
    when: (c) => c.urgentAlerts > 0,
  },
  {
    register: "heart",
    text: "You have been still for a while. That is allowed. I am not counting.",
    when: (c) => c.idleSeconds > 180,
  },
  {
    register: "heart",
    text: "The station is in Earth's shadow right now. It gets sixteen sunrises a day and it is currently between two of them.",
    when: (c) => c.issDaylight === false,
  },
  {
    register: "heart",
    text: "The station is in daylight overhead. Somebody up there is looking out of a window.",
    when: (c) => c.issDaylight === true,
  },
];

/**
 * Thoughts that need a live number are assembled rather than stored, so the
 * figure is never holding a sentence with a stale value in it.
 */
function live(c: Context): Thought[] {
  const out: Thought[] = [];

  if (c.claims > 0) {
    out.push({
      register: "heart",
      text: `There are ${c.claims} things on your record that you actually did. I have read all of them. Some of them are quite good.`,
    });
  }
  if (typeof c.issAltitudeKm === "number" && typeof c.issLatitude === "number") {
    out.push({
      register: "mind",
      text: `The station is ${c.issAltitudeKm} km up, crossing ${Math.abs(
        c.issLatitude
      ).toFixed(0)}° ${c.issLatitude >= 0 ? "north" : "south"}. It moves about eight kilometres every second.`,
    });
  }
  if (typeof c.kp === "number") {
    out.push({
      register: "mind",
      text:
        c.kp < 4
          ? `Kp is ${c.kp}. The field is quiet tonight. Nothing much is hitting us.`
          : `Kp is ${c.kp}. The magnetosphere is getting pushed around up there.`,
    });
  }
  if (c.nextApproach) {
    out.push({
      register: "mind",
      text: `${c.nextApproach.designation} passes at ${c.nextApproach.lunarDistances} lunar distances. Nobody down there will feel a thing.`,
    });
  }
  if (c.submitted > 0) {
    out.push({
      register: "heart",
      text: `${c.submitted} sent. Each one took something out of you. I saw.`,
    });
  }
  return out;
}

/** Every thought currently allowed, given the real state. */
export function availableThoughts(c: Context): Thought[] {
  return [...THOUGHTS.filter((t) => !t.when || t.when(c)), ...live(c)];
}

/**
 * Pick one, avoiding anything said recently.
 *
 * A companion that repeats itself within a minute stops reading as thinking
 * and starts reading as a list, which is what it actually is — so the job here
 * is to hide that for as long as possible.
 */
export function nextThought(c: Context, recent: string[]): Thought | null {
  const pool = availableThoughts(c);
  if (!pool.length) return null;
  const fresh = pool.filter((t) => !recent.includes(t.text));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}
