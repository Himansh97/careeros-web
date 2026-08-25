/**
 * The clock on the dashboard, and the arithmetic behind it.
 *
 * Three decisions here are the whole reason this is a module and not four
 * lines inside the component.
 *
 * **The deadline is the end of its day, not the start.** A deadline of
 * 21 October means the 21st still counts. Running the clock to 00:00 on the
 * 21st silently removes a day, and a countdown that is wrong by a day in the
 * pessimistic direction is a countdown nobody trusts.
 *
 * **The day is counted in the deadline's own time zone.** The number of days
 * between now and a calendar date is a question about calendars, not about
 * elapsed milliseconds: `Math.ceil(ms / 86_400_000)` gets it wrong across every
 * daylight-saving boundary, and it makes "days left" depend on the time of day
 * you happen to look. Configuring the zone rather than reading the browser's
 * also means the number does not change on a flight.
 *
 * **Days and the clock are computed separately.** `daysLeft` is a difference of
 * calendar days; `hours`/`minutes`/`seconds` are the remainder of the current
 * day. They are not two views of one number, so deriving one from the other
 * makes them disagree — which is exactly the kind of thing you only notice at
 * 23:59 on the last useful day.
 */

export interface DeadlineConfig {
  label: string;
  /** Calendar date, `YYYY-MM-DD`. The countdown runs to the end of this day. */
  date: string;
  /**
   * Calendar date the window opened, `YYYY-MM-DD`, or null.
   *
   * Only the progress bar uses it, and it exists because the bar is otherwise
   * drawn against a guess. When the deadline was 60 days out a hardcoded
   * 60-day window happened to be right; moving the deadline to 90 days out
   * made the bar sit at zero for its first month, because a third of the
   * window had not been drawn at all. The window has to come from the same
   * place the deadline does.
   */
  startDate: string | null;
  timeZone: string;
  note?: string;
}

export interface DeadlineCountdown {
  label: string;
  note: string;
  /** Whole calendar days remaining, in the deadline's zone. 0 on the last day. */
  daysLeft: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the deadline's final day is over. */
  passed: boolean;
  /** Fraction of the tracked window already spent, 0–1, for the progress bar. */
  elapsed: number;
  totalDays: number;
  /** ISO date of the deadline, for a `<time dateTime>` attribute. */
  isoDate: string;
  urgency: "calm" | "close" | "critical" | "passed";
}

/**
 * The deadline block from `job_preferences.yaml`, or null.
 *
 * The YAML is hand-edited, so every field is checked rather than trusted. A
 * malformed block yields no widget, which is the honest outcome: a countdown
 * built from a date the app could not parse would show a confident number that
 * means nothing.
 */
export function readDeadlineConfig(preferences: unknown): DeadlineConfig | null {
  if (!preferences || typeof preferences !== "object") return null;
  const raw = (preferences as Record<string, unknown>).deadline;
  if (!raw || typeof raw !== "object") return null;

  const block = raw as Record<string, unknown>;
  const civil = (value: unknown): string | null => {
    const text = typeof value === "string" ? value.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    return Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? null : text;
  };

  const date = civil(block.date);
  if (!date) return null;

  // A start after the deadline describes no window at all, so it is discarded
  // rather than allowed to produce a negative one.
  const start = civil(block.start);
  const startDate = start && start < date ? start : null;

  const label = typeof block.label === "string" && block.label.trim() ? block.label.trim() : "Deadline";
  const timeZone =
    typeof block.time_zone === "string" && block.time_zone.trim()
      ? block.time_zone.trim()
      : "UTC";
  const note = typeof block.note === "string" ? block.note.trim() : "";

  // An unsupported zone throws inside Intl at render time, which would take the
  // whole dashboard down for a typo in a YAML file.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    return { label, date, startDate, timeZone: "UTC", note };
  }
  return { label, date, startDate, timeZone, note };
}

/** The wall-clock parts of `instant` as seen in `timeZone`. */
function zonedParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (kind: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === kind)?.value ?? "0");
  // Intl renders midnight as hour 24 in some engines; 24:00 is 00:00 next day,
  // and left alone it makes the seconds-remaining calculation go negative.
  const hour = get("hour") % 24;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
    second: get("second"),
  };
}

/** A `YYYY-MM-DD` string as civil date parts. */
function civilFrom(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/** Whole days between two civil dates, ignoring time and time zone entirely. */
function civilDayDiff(
  from: { year: number; month: number; day: number },
  to: { year: number; month: number; day: number },
): number {
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / 86_400_000);
}

const SECONDS_PER_DAY = 86_400;

export function deadlineCountdown(
  config: DeadlineConfig,
  now: Date = new Date(),
  options: { totalDays?: number } = {},
): DeadlineCountdown {
  const { year, month, day } = civilFrom(config.date);
  const here = zonedParts(now, config.timeZone);

  // Positive while the deadline is ahead. 0 means today IS the deadline, and
  // today still counts — hence `daysLeft` of 0 with a live clock rather than
  // "passed".
  const daysLeft = civilDayDiff(here, { year, month, day });

  const secondsIntoToday = here.hour * 3600 + here.minute * 60 + here.second;
  const secondsLeftToday = SECONDS_PER_DAY - secondsIntoToday;
  const passed = daysLeft < 0;

  // Total seconds to the end of the deadline day: every whole day between here
  // and there, plus what is left of today.
  const totalSeconds = passed ? 0 : daysLeft * SECONDS_PER_DAY + secondsLeftToday;
  const remainderOfDay = passed ? 0 : secondsLeftToday;

  // The window the bar is drawn against, preferring the configured start over
  // any caller default. A window shorter than the time actually remaining
  // clamps the bar to zero, which is what a hardcoded 60 did to a 90-day
  // deadline: a third of the countdown rendered as no progress at all.
  // `+ 1` because both ends are days the candidate has, not instants: 24 Aug
  // through 22 Nov is 91 days, not the 90 a subtraction gives. Without it the
  // bar reads negative — and therefore clamps to zero — for the whole of the
  // opening day, which is the one day you would look at it to check it works.
  const configured = config.startDate
    ? civilDayDiff(civilFrom(config.startDate), { year, month, day }) + 1
    : 0;
  const totalDays = Math.max(1, Math.floor(configured || options.totalDays || 60));
  const elapsed = passed ? 1 : Math.min(1, Math.max(0, 1 - totalSeconds / (totalDays * SECONDS_PER_DAY)));

  return {
    label: config.label,
    note: config.note ?? "",
    daysLeft: Math.max(0, daysLeft),
    hours: Math.floor(remainderOfDay / 3600),
    minutes: Math.floor((remainderOfDay % 3600) / 60),
    seconds: remainderOfDay % 60,
    passed,
    elapsed,
    totalDays,
    isoDate: config.date,
    urgency: passed ? "passed" : daysLeft <= 7 ? "critical" : daysLeft <= 21 ? "close" : "calm",
  };
}

export function pad2(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}
