import { apiFetch } from "@/lib/api/client";

/**
 * The ordered list of applications prepared but not yet sent.
 *
 * Aging first, then priority. Nothing here submits — every row ends at the
 * employer's own form with the candidate pressing the button.
 */
export interface QueueRow {
  jobId: string;
  company: string;
  title: string;
  applyUrl: string | null;
  fitScore: number;
  resumeScore: number | null;
  daysWaiting: number | null;
  aging: boolean;
  platform: string | null;
  estimatedMinutes: number | null;
  priorityScore: number | null;
  blocked: boolean;
  note: string;
  frictionNote: string;
  live: boolean;
}

export interface ApplyQueue {
  queue: QueueRow[];
  total: number;
  aging: number;
  estimatedMinutes: number;
  staleAfterDays: number;
  note: string;
}

export const getApplyQueue = () => apiFetch<ApplyQueue>("/api/apply-queue");

export const prefillJob = (jobId: string) =>
  apiFetch<{ jobId: string; report: string; note: string }>(
    `/api/jobs/${encodeURIComponent(jobId)}/prefill`,
    { method: "POST" }
  );
