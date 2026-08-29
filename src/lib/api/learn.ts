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
