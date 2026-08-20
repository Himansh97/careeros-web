import { describe, expect, it } from "vitest";

import {
  feedbackAvailable,
  initialInterviewState,
  interviewReducer,
  remainingSeconds,
  VALID_DURATIONS,
} from "./interview-state";

describe("technical interview state", () => {
  it("offers exactly 30, 45, and 60 minute rounds", () => {
    expect(VALID_DURATIONS).toEqual([30, 45, 60]);
  });

  it("derives the countdown from the server anchor and expiry", () => {
    expect(remainingSeconds("2026-08-20T12:00:00Z", "2026-08-20T12:30:00Z", 5_000)).toBe(1795);
    expect(remainingSeconds("2026-08-20T12:31:00Z", "2026-08-20T12:30:00Z", 0)).toBe(0);
  });

  it("tracks dirty, saving, saved, and failed autosave states", () => {
    let state = initialInterviewState({ q1: "draft" });
    state = interviewReducer(state, { type: "edit", questionId: "q1", answer: "new" });
    expect(state.saveState.q1).toBe("dirty");
    state = interviewReducer(state, { type: "saving", questionId: "q1" });
    expect(state.saveState.q1).toBe("saving");
    state = interviewReducer(state, { type: "save-failed", questionId: "q1" });
    expect(state.saveState.q1).toBe("failed");
    state = interviewReducer(state, { type: "saved", questionId: "q1" });
    expect(state.saveState.q1).toBe("saved");
  });

  it("never exposes feedback for created or running sessions", () => {
    expect(feedbackAvailable({ state: "created" })).toBe(false);
    expect(feedbackAvailable({ state: "running" })).toBe(false);
    expect(feedbackAvailable({ state: "graded", scorecard: { score: 0.8 } })).toBe(true);
  });
});
