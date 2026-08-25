export const DAILY_APPLICATION_GOAL = 20;

export interface SubmissionRecord {
  submittedAt?: string | null;
}

export interface DailyApplicationProgress {
  today: number;
  goal: number;
  remaining: number;
  percent: number;
  filledSegments: number;
  streak: number;
}

interface ProgressOptions {
  goal?: number;
  timeZone?: string;
}

function calendarDayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (kind: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === kind)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function previousCalendarDay(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return [
    previous.getUTCFullYear(),
    String(previous.getUTCMonth() + 1).padStart(2, "0"),
    String(previous.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function dailyApplicationProgress(
  applications: readonly SubmissionRecord[],
  now = new Date(),
  options: ProgressOptions = {},
): DailyApplicationProgress {
  const goal = Math.max(1, Math.floor(options.goal ?? DAILY_APPLICATION_GOAL));
  const timeZone = options.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayKey = calendarDayKey(now, timeZone);
  const counts = new Map<string, number>();

  for (const application of applications) {
    if (!application.submittedAt) continue;
    const submittedAt = new Date(application.submittedAt);
    if (Number.isNaN(submittedAt.getTime())) continue;
    const key = calendarDayKey(submittedAt, timeZone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = counts.get(todayKey) ?? 0;
  let streak = 0;
  let streakDay = today >= goal ? todayKey : previousCalendarDay(todayKey);
  while ((counts.get(streakDay) ?? 0) >= goal) {
    streak += 1;
    streakDay = previousCalendarDay(streakDay);
  }

  return {
    today,
    goal,
    remaining: Math.max(0, goal - today),
    percent: Math.min(100, Math.round((today / goal) * 100)),
    filledSegments: Math.min(goal, today),
    streak,
  };
}
