import { API_URL, apiFetch } from "@/lib/api/client";

/**
 * Interview practice.
 *
 * The important contract here is that `findings` is deterministic and always
 * present, while `critique` may be null — the model can be unavailable or over
 * budget, and the evidence check still ran. The UI must render the findings
 * either way and say plainly when coaching was skipped, rather than showing an
 * empty panel that reads as "nothing to improve".
 *
 * An unverified figure means the evidence file has no record of it. It does
 * **not** mean it is false, and nothing in this UI may present it as such.
 */
export interface BackedFigure {
  figure: string;
  claimId: string;
  employer: string;
}

export interface Findings {
  backedFigures: BackedFigure[];
  unverifiedFigures: string[];
  unsourcedNames: string[];
  words: number;
  seconds: number;
  length: "short" | "good" | "long";
  targetSeconds: [number, number];
  fillerWords: Record<string, number>;
  fillerCount: number;
}

export interface Critique {
  verdict: string;
  strengths: string[];
  fixes: string[];
  followUps: string[];
  scores: { structure: number; specificity: number; evidence: number; length: number };
}

export interface Question {
  id: string;
  competency: string;
  prompt: string;
}

export interface SystemCheck {
  id: string;
  competency: string;
  prompt: string;
  attempts: number;
  best: number | null;
  status: "GO" | "HOLD" | "NO-GO";
  lastAttempt: string | null;
}

export interface Overview {
  systems: SystemCheck[];
  go: number;
  total: number;
  attempts: number;
  streakDays: number;
  daysPractised: number;
}

export interface AttemptResult {
  id: string;
  question: Question;
  findings: Findings;
  critique: Critique | null;
  critiqueAvailable: boolean;
}

export interface Attempt {
  id: string;
  questionId: string;
  questionText: string;
  answer: string;
  spoken: boolean;
  durationSeconds: number | null;
  findings: Findings;
  critique: Critique | null;
  scores: Partial<Critique["scores"]>;
  createdAt: string;
}

export interface AnswerShape {
  questionId: string;
  researchedAt: string;
  /** What the interviewer is actually assessing. */
  assesses: string;
  structure: string[];
  traps: string[];
  timing: string;
  /** Mandatory. Craft knowledge from outside must show where it came from. */
  sources: { title: string; url: string }[];
}

export interface Draft {
  answer: string;
  claims: { claimId: string; employer: string; claim: string }[];
  reviewNotes: string[];
}

export interface ModelAnswer {
  question: Question;
  shape: AnswerShape | null;
  draft: Draft | null;
  draftAvailable: boolean;
}

export const getModelAnswer = (questionId: string) =>
  apiFetch<ModelAnswer>(
    `/api/prep/questions/${encodeURIComponent(questionId)}/model-answer`,
  );

export const getPrepOverview = () => apiFetch<Overview>("/api/prep/overview");

export const getPrepQuestions = () =>
  apiFetch<{ kind: string; questions: Question[] }>("/api/prep/questions");

export const getAttempts = (questionId?: string) =>
  apiFetch<{ attempts: Attempt[] }>(
    questionId ? `/api/prep/attempts?questionId=${encodeURIComponent(questionId)}` : "/api/prep/attempts",
  );

export async function submitAttempt(body: {
  questionId: string;
  answer: string;
  spoken: boolean;
  durationSeconds: number | null;
}) {
  return apiFetch<AttemptResult>("/api/prep/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export { API_URL };
