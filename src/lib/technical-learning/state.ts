export type GuidedStep = "brief" | "example" | "practice" | "review" | "transfer";

export interface GuidedState {
  drillId: string;
  step: GuidedStep;
  failures: number;
  hints: { conceptual: boolean; pattern: boolean };
  solutionRevealed: boolean;
  eligibleForClearance: boolean;
}

export type GuidedAction =
  | { type: "continue" }
  | { type: "failed" }
  | { type: "reveal-solution" }
  | { type: "go-to"; step: GuidedStep };

const ORDER: GuidedStep[] = ["brief", "example", "practice", "review", "transfer"];
const DRAFT_PREFIX = "careeros:technical-draft:";

export function nextGuidedStep(step: GuidedStep): GuidedStep {
  const index = ORDER.indexOf(step);
  return ORDER[Math.min(index + 1, ORDER.length - 1)];
}

export function initialGuidedState(drillId: string): GuidedState {
  return {
    drillId,
    step: "brief",
    failures: 0,
    hints: { conceptual: false, pattern: false },
    solutionRevealed: false,
    eligibleForClearance: true,
  };
}

export function guidedReducer(state: GuidedState, action: GuidedAction): GuidedState {
  if (action.type === "continue") return { ...state, step: nextGuidedStep(state.step) };
  if (action.type === "go-to") return { ...state, step: action.step };
  if (action.type === "failed") {
    const failures = state.failures + 1;
    return {
      ...state,
      failures,
      hints: { conceptual: failures >= 1, pattern: failures >= 2 },
    };
  }
  return { ...state, solutionRevealed: true, eligibleForClearance: false };
}

export interface MapDraftStorage {
  get(key: string): string | undefined | null;
  set(key: string, value: string): unknown;
}

export interface BrowserDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
}

export type DraftStorage = MapDraftStorage | BrowserDraftStorage;

export function saveDraft(storage: DraftStorage, drillId: string, answer: string): void {
  const key = `${DRAFT_PREFIX}${drillId}`;
  if ("setItem" in storage) storage.setItem(key, answer);
  else storage.set(key, answer);
}

export function recoverDraft(storage: DraftStorage, drillId: string): string {
  const key = `${DRAFT_PREFIX}${drillId}`;
  return ("getItem" in storage ? storage.getItem(key) : storage.get(key)) ?? "";
}
