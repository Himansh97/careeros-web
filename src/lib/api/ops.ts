import { API_URL, apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

export interface OutreachRecord {
  id: string;
  jobId: string;
  contactId: string | null;
  company: string;
  jobTitle: string;
  channel: string;
  status: "drafted" | "sent" | "replied" | string;
  emailSubject: string | null;
  emailDraft: string | null;
  linkedinDraft: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  followUpDueAt: string | null;
  createdAt: string;
}

export interface FollowUp extends OutreachRecord {
  overdue: boolean;
}

export interface SavedSearchRecord {
  id: string;
  label: string;
  filters: Record<string, unknown>;
  autoRerun: boolean;
  lastRunAt: string | null;
  createdAt?: string;
}

export interface AutomationNode {
  id: string;
  label: string;
  state: "complete" | "running" | "queued" | "blocked" | "failed" | "idle";
  detail: string | null;
}

export interface AutomationRules {
  minimumFitToTailor: number;
  minimumResumeScore: number;
  maxApplicationsPerDay: number;
  submissionMode: string;
  emailMode: string;
  jobRecencyDays: number;
  autoRejectBelowFit: number;
  recruiterConfidenceMinimum: number;
  followUpDelayBusinessDays: number;
  targetQueries: string[];
}

export interface AutomationStatus {
  running: boolean;
  rules: AutomationRules;
  note: string;
  lastRun: {
    id: number;
    startedAt: string;
    finishedAt: string | null;
    status: string;
    stats: Record<string, number>;
    nodes: AutomationNode[];
  } | null;
}

export const listOutreach = () =>
  apiFetch<{ outreach: OutreachRecord[] }>("/api/outreach");

export const setOutreachStatus = (
  id: string,
  action: "sent" | "replied" | "unreplied"
) =>
  apiFetch<OutreachRecord>(`/api/outreach/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });

export const listFollowUps = () =>
  apiFetch<{ followUps: FollowUp[] }>("/api/follow-ups");

export const listSavedSearches = () =>
  apiFetch<{ searches: SavedSearchRecord[] }>("/api/saved-searches");

export const createSavedSearch = (label: string, filters: Record<string, unknown>) =>
  apiFetch<SavedSearchRecord>("/api/saved-searches", {
    method: "POST",
    body: JSON.stringify({ label, filters }),
  });

export async function deleteSavedSearch(id: string): Promise<void> {
  if (!isLiveApi()) return;
  await fetch(`${API_URL}/api/saved-searches/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export const toggleSavedSearch = (id: string) =>
  apiFetch<SavedSearchRecord>(`/api/saved-searches/${encodeURIComponent(id)}/toggle`, {
    method: "POST",
  });

export const getAutomation = () => apiFetch<AutomationStatus>("/api/automation");

export const runAutopilot = (maxTailor?: number) =>
  apiFetch<{ runId: number; status: string; stats: Record<string, number>; nodes: AutomationNode[] }>(
    "/api/automation/run",
    { method: "POST", body: JSON.stringify({ maxTailor: maxTailor ?? null }) }
  );

export const saveAutomationRules = (rules: Partial<AutomationRules>) =>
  apiFetch<AutomationRules>("/api/automation/rules", {
    method: "PATCH",
    body: JSON.stringify(rules),
  });

export type { ApiResult };

export interface CareerAlert {
  kind: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  action: string;
  ref: string | null;
}

/**
 * What is outstanding — written, approved or received, and not acted on.
 *
 * The inverse of follow-ups, which only knows about things that happened. Six
 * outreach drafts sat unsent for days and a SoFi application stopped on a
 * security-code step, none of it visible anywhere in the app.
 */
export const listAlerts = () =>
  apiFetch<{ alerts: CareerAlert[]; high: number }>("/api/alerts");

export interface SkillGap {
  skill: string;
  jobs: number;
  shareOfTargets: number;
  requiredIn: number;
  meanFit: number;
  examples: string[];
  weight: number;
  note: string;
}

/**
 * Which missing requirement costs the most across the roles worth applying to.
 *
 * Aggregated, not per-job: one resume's gap list says what one employer wanted;
 * across the target set it says what to go and learn. No time-to-learn estimate
 * is returned, because that number would be invented.
 */
export const listSkillGaps = () =>
  apiFetch<{ gaps: SkillGap[]; consideredJobs: number; minimumFit: number; note: string }>(
    "/api/skill-gaps"
  );
