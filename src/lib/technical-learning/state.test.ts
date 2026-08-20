import { describe, expect, it } from "vitest";

import {
  guidedReducer,
  initialGuidedState,
  nextGuidedStep,
  recoverDraft,
  saveDraft,
} from "./state";


describe("guided learning state", () => {
  it("moves through brief, example, practice, review, and transfer in order", () => {
    let state = initialGuidedState("sql-revenue-by-segment");
    expect(state.step).toBe("brief");
    for (const expected of ["example", "practice", "review", "transfer"] as const) {
      state = guidedReducer(state, { type: "continue" });
      expect(state.step).toBe(expected);
    }
    expect(nextGuidedStep("transfer")).toBe("transfer");
  });

  it("unlocks conceptual and pattern hints after one and two failures", () => {
    let state = initialGuidedState("stats-ab-test");
    state = guidedReducer(state, { type: "failed" });
    expect(state.hints).toEqual({ conceptual: true, pattern: false });
    state = guidedReducer(state, { type: "failed" });
    expect(state.hints).toEqual({ conceptual: true, pattern: true });
  });

  it("marks a revealed solution as ineligible for independent clearance", () => {
    const state = guidedReducer(initialGuidedState("stats-ab-test"), { type: "reveal-solution" });
    expect(state.solutionRevealed).toBe(true);
    expect(state.eligibleForClearance).toBe(false);
  });

  it("recovers drafts per drill without mixing answers", () => {
    const storage = new Map<string, string>();
    saveDraft(storage, "sql-one", "SELECT 1");
    saveDraft(storage, "sql-two", "SELECT 2");
    expect(recoverDraft(storage, "sql-one")).toBe("SELECT 1");
    expect(recoverDraft(storage, "missing")).toBe("");
  });

  it("uses the browser Storage contract", () => {
    const values = new Map<string, string>();
    const browserStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    saveDraft(browserStorage, "sql-browser", "SELECT 42");
    expect(recoverDraft(browserStorage, "sql-browser")).toBe("SELECT 42");
  });
});
