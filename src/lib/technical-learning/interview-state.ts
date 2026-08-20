export const VALID_DURATIONS = [30, 45, 60] as const;
export type InterviewDuration = (typeof VALID_DURATIONS)[number];
export type SaveState = "clean" | "dirty" | "saving" | "saved" | "failed";

export interface InterviewWorkspaceState {
  answers: Record<string, unknown>;
  saveState: Record<string, SaveState>;
}

export type InterviewAction =
  | { type: "edit"; questionId: string; answer: unknown }
  | { type: "saving" | "saved" | "save-failed"; questionId: string };

export function initialInterviewState(answers: Record<string, unknown>): InterviewWorkspaceState {
  return {
    answers: { ...answers },
    saveState: Object.fromEntries(Object.keys(answers).map((id) => [id, "clean" as const])),
  };
}

export function interviewReducer(state: InterviewWorkspaceState, action: InterviewAction): InterviewWorkspaceState {
  if (action.type === "edit") {
    return {
      answers: { ...state.answers, [action.questionId]: action.answer },
      saveState: { ...state.saveState, [action.questionId]: "dirty" },
    };
  }
  const status: SaveState = action.type === "saving" ? "saving" : action.type === "saved" ? "saved" : "failed";
  return { ...state, saveState: { ...state.saveState, [action.questionId]: status } };
}

export function remainingSeconds(serverNow: string, expiresAt: string, elapsedClientMs: number): number {
  const anchoredNow = Date.parse(serverNow) + Math.max(0, elapsedClientMs);
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - anchoredNow) / 1000));
}

export function feedbackAvailable(session: { state: string; scorecard?: unknown }): boolean {
  return session.state === "graded" && session.scorecard !== undefined;
}
