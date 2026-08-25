import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DailyApplicationCounter } from "./daily-application-counter";

describe("DailyApplicationCounter", () => {
  it("shows today's real progress, remaining work, and streak accessibly", () => {
    render(
      <DailyApplicationCounter
        applications={[
          ...Array.from({ length: 7 }, () => ({ submittedAt: "2026-08-20T17:00:00Z" })),
          ...Array.from({ length: 20 }, () => ({ submittedAt: "2026-08-19T17:00:00Z" })),
        ]}
        now={new Date("2026-08-20T20:00:00Z")}
        timeZone="America/Chicago"
      />,
    );

    expect(screen.getByText("7 / 20")).toBeInTheDocument();
    expect(screen.getByText("13 remaining today")).toBeInTheDocument();
    expect(screen.getByText("1 day streak")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "7 of 20 applications submitted today" })).toHaveAttribute(
      "aria-valuenow",
      "7",
    );
  });
});
