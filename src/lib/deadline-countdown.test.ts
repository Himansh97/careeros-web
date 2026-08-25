import { describe, expect, it } from "vitest";

import {
  deadlineCountdown,
  readDeadlineConfig,
  type DeadlineConfig,
} from "./deadline-countdown";

const CHICAGO: DeadlineConfig = {
  label: "Job search deadline",
  date: "2026-10-21",
  startDate: null,
  timeZone: "America/Chicago",
  note: "",
};

describe("deadlineCountdown", () => {
  it("counts calendar days in the deadline's zone, not elapsed milliseconds", () => {
    // 05:30 UTC on 22 Aug is still 00:30 on 22 Aug in Chicago. A naive
    // ms/86400000 would round this to a different day depending on the hour.
    expect(deadlineCountdown(CHICAGO, new Date("2026-08-22T05:30:00Z")).daysLeft).toBe(60);
    expect(deadlineCountdown(CHICAGO, new Date("2026-08-22T23:30:00Z")).daysLeft).toBe(60);
  });

  it("does not change the day count when the browser's zone differs", () => {
    const utcSameInstant = deadlineCountdown(
      { ...CHICAGO, timeZone: "UTC" },
      new Date("2026-08-22T04:00:00Z"),
    );
    // 04:00 UTC on the 22nd is 23:00 on the 21st in Chicago — a real one-day
    // disagreement, which is why the zone is configured rather than inferred.
    expect(utcSameInstant.daysLeft).toBe(60);
    expect(deadlineCountdown(CHICAGO, new Date("2026-08-22T04:00:00Z")).daysLeft).toBe(61);
  });

  it("survives the daylight-saving change between now and the deadline", () => {
    // 1 Nov 2026 is the US fall-back. A 24h-per-day subtraction drifts by an
    // hour across it, which is enough to move a day boundary.
    const acrossDst: DeadlineConfig = { ...CHICAGO, date: "2026-11-10" };
    expect(deadlineCountdown(acrossDst, new Date("2026-10-25T18:00:00Z")).daysLeft).toBe(16);
  });

  it("treats the deadline day itself as still available", () => {
    const onTheDay = deadlineCountdown(CHICAGO, new Date("2026-10-21T14:00:00Z"));
    expect(onTheDay.daysLeft).toBe(0);
    expect(onTheDay.passed).toBe(false);
    // 09:00 Chicago -> exactly 15h of the day left.
    expect(onTheDay).toMatchObject({ hours: 15, minutes: 0, seconds: 0 });
  });

  it("only reports passed after the deadline day has ended locally", () => {
    // 04:00 UTC on the 22nd is 23:00 on the 21st in Chicago: not over yet.
    expect(deadlineCountdown(CHICAGO, new Date("2026-10-22T04:00:00Z")).passed).toBe(false);
    expect(deadlineCountdown(CHICAGO, new Date("2026-10-22T06:00:00Z")).passed).toBe(true);
  });

  it("zeroes the clock once it has passed rather than counting up", () => {
    const after = deadlineCountdown(CHICAGO, new Date("2026-12-01T12:00:00Z"));
    expect(after).toMatchObject({
      daysLeft: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      passed: true,
      elapsed: 1,
      urgency: "passed",
    });
  });

  it("counts the remainder of today, independently of the day count", () => {
    // 23:59:00 Chicago on 20 Oct: one day and one minute left.
    const late = deadlineCountdown(CHICAGO, new Date("2026-10-21T04:59:00Z"));
    expect(late).toMatchObject({ daysLeft: 1, hours: 0, minutes: 1, seconds: 0 });
  });

  it("escalates urgency as the window closes", () => {
    const at = (date: string) => deadlineCountdown(CHICAGO, new Date(date)).urgency;
    expect(at("2026-08-22T17:00:00Z")).toBe("calm");
    expect(at("2026-10-05T17:00:00Z")).toBe("close");
    expect(at("2026-10-18T17:00:00Z")).toBe("critical");
  });

  it("reports elapsed progress across the tracked window", () => {
    const start = deadlineCountdown(CHICAGO, new Date("2026-08-22T05:00:00Z"), {
      totalDays: 60,
    });
    expect(start.elapsed).toBeLessThan(0.02);
    // Midnight Chicago on 16 Oct: 5 whole days plus all of today = 6 of 60.
    const late = deadlineCountdown(CHICAGO, new Date("2026-10-16T05:00:00Z"), {
      totalDays: 60,
    });
    expect(late.elapsed).toBeCloseTo(0.9, 6);

    // Never above 1, however far past the window the deadline sits.
    const beyond = deadlineCountdown(CHICAGO, new Date("2026-01-01T05:00:00Z"), {
      totalDays: 60,
    });
    expect(beyond.elapsed).toBe(0);
  });

  it("draws the bar against the configured window, not a hardcoded 60 days", () => {
    // The real deadline is 90 days out. Against a 60-day window the bar is
    // clamped to zero for its whole first month — a third of the countdown
    // rendered as no progress at all.
    const real: DeadlineConfig = {
      ...CHICAGO,
      date: "2026-11-22",
      startDate: "2026-08-24",
    };
    const day1 = deadlineCountdown(real, new Date("2026-08-24T17:00:00Z"));
    // 24 Aug through 22 Nov inclusive is 91 days the candidate has, not the 90
    // a plain subtraction gives — and the off-by-one shows up as a bar that is
    // pinned to zero for the whole opening day.
    expect(day1.totalDays).toBe(91);
    expect(day1.daysLeft).toBe(90);
    expect(day1.elapsed).toBeGreaterThan(0);
    expect(day1.elapsed).toBeLessThan(0.02);

    // Midnight at the very start of the window is exactly zero, not negative.
    expect(deadlineCountdown(real, new Date("2026-08-24T05:00:00Z")).elapsed).toBe(0);

    const halfway = deadlineCountdown(real, new Date("2026-10-08T05:00:00Z"));
    expect(halfway.elapsed).toBeCloseTo(0.495, 3);

    // Without the configured window the same instant is pinned to zero.
    expect(
      deadlineCountdown({ ...real, startDate: null }, new Date("2026-08-24T17:00:00Z"))
        .elapsed,
    ).toBe(0);
  });
});

describe("readDeadlineConfig", () => {
  it("reads the block the YAML actually produces", () => {
    expect(
      readDeadlineConfig({
        deadline: {
          label: "OPT unemployment clock",
          date: "2026-11-22",
          start: "2026-08-24",
          time_zone: "America/Chicago",
          note: "90-day limit",
        },
      }),
    ).toEqual({
      label: "OPT unemployment clock",
      date: "2026-11-22",
      startDate: "2026-08-24",
      timeZone: "America/Chicago",
      note: "90-day limit",
    });
  });

  it("discards a start that is not before the deadline", () => {
    // A backwards window would make the progress bar negative.
    expect(
      readDeadlineConfig({
        deadline: { date: "2026-11-22", start: "2026-12-01" },
      }),
    ).toMatchObject({ startDate: null });
    expect(
      readDeadlineConfig({ deadline: { date: "2026-11-22", start: "nonsense" } }),
    ).toMatchObject({ startDate: null });
  });

  it("returns null rather than a confident wrong number", () => {
    // The YAML is hand-edited. Every one of these has to yield no widget, not
    // a clock counting to NaN or to the epoch.
    expect(readDeadlineConfig(undefined)).toBeNull();
    expect(readDeadlineConfig({})).toBeNull();
    expect(readDeadlineConfig({ deadline: "2026-10-21" })).toBeNull();
    expect(readDeadlineConfig({ deadline: { date: "" } })).toBeNull();
    expect(readDeadlineConfig({ deadline: { date: "21/10/2026" } })).toBeNull();
    expect(readDeadlineConfig({ deadline: { date: "2026-13-45" } })).toBeNull();
  });

  it("falls back to UTC for a time zone Intl rejects", () => {
    // A typo in the YAML would otherwise throw inside Intl at render time and
    // take the whole dashboard with it.
    const config = readDeadlineConfig({
      deadline: { date: "2026-10-21", time_zone: "America/Chicagoo" },
    });
    expect(config).toMatchObject({ timeZone: "UTC" });
  });
});
