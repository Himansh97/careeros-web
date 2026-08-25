import { describe, expect, it } from "vitest";

import { dailyApplicationProgress } from "./daily-application-progress";

const submitted = (...submittedAt: (string | null | undefined)[]) =>
  submittedAt.map((value) => ({ submittedAt: value }));

describe("dailyApplicationProgress", () => {
  it("counts only submissions on the current local calendar day", () => {
    const progress = dailyApplicationProgress(
      submitted(
        "2026-08-20T04:30:00Z",
        "2026-08-20T05:30:00Z",
        "2026-08-21T04:59:59Z",
        null,
        "not-a-date",
      ),
      new Date("2026-08-20T17:00:00Z"),
      { goal: 20, timeZone: "America/Chicago" },
    );

    expect(progress).toMatchObject({
      today: 2,
      goal: 20,
      remaining: 18,
      percent: 10,
    });
  });

  it("keeps yesterday's streak while today is still in progress", () => {
    const records = submitted(
      ...Array.from({ length: 20 }, (_, index) =>
        `2026-08-19T${String(12 + Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 10).padStart(2, "0")}:00Z`,
      ),
      ...Array.from({ length: 7 }, (_, index) =>
        `2026-08-20T${String(12 + index).padStart(2, "0")}:00:00Z`,
      ),
    );

    expect(
      dailyApplicationProgress(records, new Date("2026-08-20T20:00:00Z"), {
        goal: 20,
        timeZone: "America/Chicago",
      }),
    ).toMatchObject({ today: 7, remaining: 13, streak: 1 });
  });

  it("adds today after the goal is reached and stops at a missed day", () => {
    const records = submitted(
      ...Array.from({ length: 20 }, () => "2026-08-20T17:00:00Z"),
      ...Array.from({ length: 22 }, () => "2026-08-19T17:00:00Z"),
      ...Array.from({ length: 19 }, () => "2026-08-18T17:00:00Z"),
      ...Array.from({ length: 20 }, () => "2026-08-17T17:00:00Z"),
    );

    expect(
      dailyApplicationProgress(records, new Date("2026-08-20T20:00:00Z"), {
        goal: 20,
        timeZone: "America/Chicago",
      }),
    ).toMatchObject({ today: 20, remaining: 0, percent: 100, streak: 2 });
  });

  it("caps visual progress while preserving applications beyond the goal", () => {
    const records = submitted(
      ...Array.from({ length: 23 }, () => "2026-08-20T17:00:00Z"),
    );

    expect(
      dailyApplicationProgress(records, new Date("2026-08-20T20:00:00Z"), {
        goal: 20,
        timeZone: "America/Chicago",
      }),
    ).toMatchObject({ today: 23, remaining: 0, percent: 100, filledSegments: 20 });
  });
});
