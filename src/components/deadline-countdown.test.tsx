import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeadlineCountdownCard } from "./deadline-countdown";
import type { DeadlineConfig } from "@/lib/deadline-countdown";

const CONFIG: DeadlineConfig = {
  label: "Job search deadline",
  date: "2026-10-21",
  startDate: null,
  timeZone: "America/Chicago",
  note: "",
};

/** The card reads a module-level clock, so the tests drive real timers. */
function renderAt(iso: string, config: DeadlineConfig | null = CONFIG) {
  vi.setSystemTime(new Date(iso));
  const result = render(<DeadlineCountdownCard config={config} />);
  // useSyncExternalStore's subscribe ticks the store immediately; advancing
  // past the placeholder frame is what replaces the reserved-height skeleton.
  vi.advanceTimersByTime(1000);
  return result;
}

describe("DeadlineCountdownCard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when no deadline is configured", () => {
    // An invented date would be the one number on the dashboard tracing to
    // nothing, so an absent config must produce an absent widget.
    const { container } = renderAt("2026-08-22T17:00:00Z", null);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders no time on the server, so hydration has nothing to disagree about", () => {
    // `new Date()` on the server and on the client are different numbers, and
    // React discards the server HTML when they differ. The server snapshot is
    // 0, which renders a reserved-height placeholder instead of a clock.
    vi.setSystemTime(new Date("2026-08-22T17:00:00Z"));
    const markup = renderToStaticMarkup(<DeadlineCountdownCard config={CONFIG} />);
    expect(markup).not.toContain(">60<");
    expect(markup).toContain("h-[104px]");
  });

  it("shows the day count, a ticking clock, and the deadline date", () => {
    renderAt("2026-08-22T17:00:00Z");

    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("days left")).toBeInTheDocument();
    expect(screen.getByText("Job search deadline")).toBeInTheDocument();
    // 12:00 Chicago -> 12 hours of the day left.
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute("dateTime", "2026-10-21");
  });

  it("states the remaining time once, in a label, rather than ticking at a screen reader", () => {
    renderAt("2026-08-22T17:00:00Z");
    const region = screen.getByLabelText(
      "Job search deadline: 60 days remaining, until Wed, Oct 21, 2026.",
    );
    expect(region).toBeInTheDocument();
    // Every ticking digit is hidden from the accessibility tree.
    expect(region.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it("says the last day is the last day rather than counting it as gone", () => {
    renderAt("2026-10-21T14:00:00Z");
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Job search deadline: today is the last day, 15 hours remaining."),
    ).toBeInTheDocument();
  });

  it("reports a passed deadline instead of counting upward", () => {
    renderAt("2026-11-01T17:00:00Z");
    expect(screen.getByText("days — passed")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Job search deadline: passed on Wed, Oct 21, 2026."),
    ).toBeInTheDocument();
  });

  it("does not repeat the unit when the label already carries it", () => {
    // "DAYS LEFT TO THE BEST JOB / 90 / days left" reads as a bug.
    renderAt("2026-08-24T17:00:00Z", { ...CONFIG, label: "Days left to the best job" });
    expect(screen.getByText("Days left to the best job")).toBeInTheDocument();
    expect(screen.queryByText("days left")).not.toBeInTheDocument();
    // The number itself is still there, and still described in full.
    expect(screen.getByText("58")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Days left to the best job: 58 days remaining, until Wed, Oct 21, 2026.",
      ),
    ).toBeInTheDocument();
  });

  it("still says days — passed once it is over, whatever the label", () => {
    renderAt("2026-11-01T17:00:00Z", { ...CONFIG, label: "Days left to the best job" });
    expect(screen.getByText("days — passed")).toBeInTheDocument();
  });

  it("shows the note under the clock only when there is one", () => {
    renderAt("2026-08-22T17:00:00Z");
    expect(screen.queryByText(/90-day limit/)).not.toBeInTheDocument();

    screen.getByText("Job search deadline");
    render(
      <DeadlineCountdownCard config={{ ...CONFIG, note: "90-day limit runs out." }} />,
    );
    vi.advanceTimersByTime(1000);
    expect(screen.getByText("90-day limit runs out.")).toBeInTheDocument();
  });
});
