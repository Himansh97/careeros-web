import { apiFetch } from "@/lib/api/client";

export type TechnicalKind = "sql" | "python" | "case";

export interface TechnicalDrill {
  id: string;
  title: string;
  track: "analytics-core" | "data-stack" | "role-mission";
  skill: string;
  concept: string;
  kind: TechnicalKind;
  stage: "practice" | "transfer";
  difficulty: "foundation" | "intermediate" | "advanced";
  prerequisites: string[];
  prompt: string;
  brief: string;
  example: string;
  dataset_id: string | null;
  dataset_version: string | null;
  starter_answer: string;
  fixture: Record<string, unknown[]>;
  ordered: boolean;
  numeric_tolerance: number;
  hints: { conceptual: string; pattern: string };
  debrief: string;
  transfer_group: string;
  interview_eligible: boolean;
  schema?: DatasetTable[];
}

export interface DatasetTable {
  table: string;
  columns: { name: string; type: string }[];
  rows: number;
}

export interface SkillProgress {
  skill: string;
  cleared: number;
  total: number;
  mastered: boolean;
  personalBest: number;
}

export interface TechnicalOverview {
  curriculumVersion: string;
  skills: SkillProgress[];
  attempts: number;
  recommendations: { drillId: string; title: string; reason: string }[];
}

export interface TechnicalCurriculum {
  version: string;
  title: string;
  drills: TechnicalDrill[];
  missions: { id: string; role: string; title: string; description: string; drill_ids: string[] }[];
}

export interface QueryResult {
  ok: boolean;
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  truncated: boolean;
  errorCode: string | null;
  message: string | null;
}

export interface AttemptResult {
  id: string;
  drillId: string;
  grade: {
    passed: boolean;
    score: number;
    summary: string;
    differences: string[];
    rubric: { id: string; label: string; met: boolean; feedback: string }[];
  };
  cleared: boolean;
  hints: { conceptual: boolean; pattern: boolean; solutionRevealAvailable: boolean };
  debrief: string;
  solution?: string;
  createdAt: string;
}

export type TechnicalQuestion = TechnicalDrill;

export interface ScorecardQuestion {
  questionId: string;
  title: string;
  skill: string;
  passed: boolean;
  score: number;
  summary: string;
  differences: string[];
  rubric: AttemptResult["grade"]["rubric"];
  solution: string;
  debrief: string;
}

export interface TechnicalSession {
  id: string;
  curriculumVersion: string;
  durationMinutes: 30 | 45 | 60;
  role: string | null;
  state: "created" | "running" | "graded";
  questions: TechnicalQuestion[];
  answers: Record<string, unknown>;
  createdAt: string;
  startedAt: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  completionReason: "submitted" | "expired" | null;
  serverNow: string;
  scorecard?: { score: number; passed: boolean; questions: ScorecardQuestion[]; reviewQueue: string[] };
}

export const getTechnicalOverview = () => apiFetch<TechnicalOverview>("/api/prep/technical");
export const getTechnicalCurriculum = () => apiFetch<TechnicalCurriculum>("/api/prep/technical/curriculum");
export const getTechnicalDrill = (id: string) =>
  apiFetch<TechnicalDrill>(`/api/prep/technical/drills/${encodeURIComponent(id)}`);
export const runTechnicalSql = (drillId: string, sql: string) =>
  apiFetch<QueryResult>("/api/prep/technical/run", {
    method: "POST",
    body: JSON.stringify({ drillId, sql }),
  });
export const submitTechnicalAttempt = (body: {
  drillId: string;
  answer: unknown;
  hintsUnlocked?: number;
  solutionRevealed?: boolean;
}) => apiFetch<AttemptResult>("/api/prep/technical/attempts", { method: "POST", body: JSON.stringify(body) });
export const createTechnicalSession = (durationMinutes: 30 | 45 | 60, role: string | null) =>
  apiFetch<TechnicalSession>("/api/prep/technical/sessions", {
    method: "POST",
    body: JSON.stringify({ durationMinutes, role }),
  });
export const startTechnicalSession = (id: string) =>
  apiFetch<TechnicalSession>(`/api/prep/technical/sessions/${encodeURIComponent(id)}/start`, { method: "POST" });
export const saveTechnicalAnswer = (sessionId: string, questionId: string, answer: unknown) =>
  apiFetch<{ sessionId: string; questionId: string; savedAt: string }>(
    `/api/prep/technical/sessions/${encodeURIComponent(sessionId)}/answers/${encodeURIComponent(questionId)}`,
    { method: "PATCH", body: JSON.stringify({ answer }) },
  );
export const submitTechnicalSession = (id: string) =>
  apiFetch<TechnicalSession>(`/api/prep/technical/sessions/${encodeURIComponent(id)}/submit`, { method: "POST" });
export const getTechnicalSession = (id: string) =>
  apiFetch<TechnicalSession>(`/api/prep/technical/sessions/${encodeURIComponent(id)}`);
