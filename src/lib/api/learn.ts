import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

/**
 * Lessons that teach, as distinct from drills that test and cards that define.
 *
 * The tutor is bounded by the lesson's key points, which are deliberately NOT
 * sent to the client. They are the assertion boundary the server holds it to,
 * and shipping them would also defeat the point — a bullet list to skim instead
 * of an explanation to read is exactly what this replaces.
 */

export type LessonStatus = "not-started" | "taught" | "explained" | "mastered";
export type TeachMode = "teach" | "simpler" | "deeper" | "example" | "stuck";

export interface LessonSummary {
  id: string;
  title: string;
  track: string;
  level: "foundation" | "working" | "interview" | "advanced";
  order: number;
  hook: string;
  status: LessonStatus;
  /** False while a prerequisite is untaught. The path is ordered. */
  unlocked: boolean;
  prerequisites: string[];
  keyPoints: number;
  hasExample: boolean;
}

export interface QueryResult {
  ok: boolean;
  columns: string[];
  rows: unknown[][];
  error?: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  track: string;
  level: string;
  hook: string;
  objectives: string[];
  misconceptions: { claim: string; correction: string }[];
  interviewAngle: string;
  sources: string[];
  /** The worked example, already executed server-side against the dataset. */
  example: {
    caption: string;
    body: string;
    sql: string | null;
    result: QueryResult | null;
  } | null;
  /** The diagram, in the shared renderer's vocabulary. */
  visual: import("@/components/diagram/diagram").DiagramSpec | null;
  practiceDrillId: string | null;
  status: LessonStatus;
}

export interface TeachTurn {
  ok: boolean;
  mode: TeachMode;
  body: string;
  /** True when served from storage — the first pass costs, re-reads do not. */
  cached?: boolean;
  costUsd?: number;
  reason?: string;
}

const offline = <T,>(): Promise<ApiResult<T>> =>
  Promise.resolve({ ok: false, reason: "not_connected" });

export interface LessonIndex {
  lessons: LessonSummary[];
  tracks: string[];
  taught: number;
  total: number;
  /** The next unlocked, unstarted lesson per track — the resume point. */
  next: Record<string, string | null>;
}

export const listLessons = (track?: string) =>
  isLiveApi()
    ? apiFetch<LessonIndex>(
        `/api/learn/lessons${track ? `?track=${encodeURIComponent(track)}` : ""}`,
      )
    : offline<LessonIndex>();

export const getLesson = (id: string) =>
  isLiveApi()
    ? apiFetch<LessonDetail>(`/api/learn/lessons/${encodeURIComponent(id)}`)
    : offline<LessonDetail>();

export const teachLesson = (
  id: string,
  mode: TeachMode,
  message = "",
  history: { role: string; content: string }[] = [],
) =>
  isLiveApi()
    ? apiFetch<TeachTurn>(`/api/learn/lessons/${encodeURIComponent(id)}/teach`, {
        method: "POST",
        body: JSON.stringify({ mode, message, history }),
      })
    : offline<TeachTurn>();

export const markExplained = (id: string) =>
  isLiveApi()
    ? apiFetch<{ lessonId: string; state: string }>(
        `/api/learn/lessons/${encodeURIComponent(id)}/explained`,
        { method: "POST" },
      )
    : offline<{ lessonId: string; state: string }>();

/**
 * What teaches a requirement, resolved server-side from the posting's own
 * wording. Matching lived in the component before this and matched almost
 * nothing: a job page says "ETL" or "A/B testing", and no lesson is titled
 * either. The server owns the vocabulary because it already owns the one used
 * for scoring.
 */
export interface Explanation {
  term: string;
  card: {
    term: string;
    claims: { claimId: string; claim: string; employer: string }[];
    definition: string;
    simple: string;
    application: string;
    visual: import("@/components/diagram/diagram").DiagramSpec | null;
  } | null;
  lesson: {
    id: string;
    title: string;
    track: string;
    level: string;
    hook: string;
    visual: import("@/components/diagram/diagram").DiagramSpec | null;
  } | null;
  /** How it was found, or null when nothing teaches it. */
  matched: "exact" | "alias" | "card" | null;
}

export const explainTerm = (term: string) =>
  isLiveApi()
    ? apiFetch<Explanation>(
        `/api/learn/explain?term=${encodeURIComponent(term)}`,
      )
    : offline<Explanation>();

/**
 * Say it back in your own words, and be told what you left out.
 *
 * Never a score, by design — three buckets and one thing worth re-learning.
 * `backwards` is the only real failure: `missed` means absent, which is not the
 * same as wrong.
 */
export interface CheckedPoint {
  n: number;
  point: string;
  /** Your own words, verbatim, where you stated it inverted. */
  quote?: string | null;
}

export interface ExplainBack {
  ok: boolean;
  reason?: string;
  lessonId: string;
  lessonTitle: string;
  term: string | null;
  carried: CheckedPoint[];
  missed: CheckedPoint[];
  backwards: CheckedPoint[];
  /** The one idea worth being taught again. Hands straight to `stuck`. */
  next: { n: number; point: string } | null;
  /** Nothing missing and nothing inverted. Only then is it "explained". */
  settled: boolean;
  state?: string;
  costUsd?: number;
}

export const explainBack = (
  explanation: string,
  target: { term?: string; lessonId?: string },
) =>
  isLiveApi()
    ? apiFetch<ExplainBack>("/api/learn/explain-back", {
        method: "POST",
        body: JSON.stringify({ explanation, ...target }),
      })
    : offline<ExplainBack>();

/** What a posting will make you defend out loud, drawn from its requirements. */
export interface DefendItem {
  term: string;
  claimed: boolean;
  importance: string;
  lessonId: string;
  lessonTitle: string;
  hook: string;
  settled: boolean;
  points: number;
}

export interface DefendSet {
  jobId: string;
  title: string;
  company: string;
  items: DefendItem[];
  settledCount: number;
  total: number;
}

export const getDefendSet = (jobId: string) =>
  isLiveApi()
    ? apiFetch<DefendSet>(`/api/jobs/${encodeURIComponent(jobId)}/defend`)
    : offline<DefendSet>();
