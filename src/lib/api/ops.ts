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
  /** Joined from the contact record so a draft can be addressed without
   *  leaving the page. Null when no contact was ever identified. */
  contactName?: string | null;
  contactTitle?: string | null;
  contactEmail?: string | null;
  contactLinkedin?: string | null;
  contactEmailVerified?: boolean;
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
/**
 * Counts through the pipeline, and whether they support a rate yet.
 *
 * Deliberately counts and not percentages until there is enough to divide.
 * `inferredTimestamps` says how many submit dates were reconstructed during
 * the backfill rather than observed — a figure that must stay visible, because
 * timing conclusions drawn from a reconstructed date are weaker than they look.
 */
export interface Funnel {
  tracked: number;
  submitted: number;
  responded: number;
  interviews: number;
  offers: number;
  rejections: number;
  inferredTimestamps: number;
  ratesAvailable: boolean;
  needForRates: number;
  note: string;
}

export const listAlerts = () =>
  apiFetch<{ alerts: CareerAlert[]; high: number; funnel: Funnel }>("/api/alerts");

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

export interface InterviewIntel {
  researched: boolean;
  company: string;
  roleFamily: string;
  note?: string;
  exactFamily?: boolean;
  researchedAt?: string;
  ageDays?: number;
  stale?: boolean;
  sources?: { title: string; url: string }[];
  timeline?: string;
  rounds?: { name: string; detail: string }[];
  questionTypes?: string[];
  prepare?: string[];
  reportedPitfalls?: string[];
  notes?: string;
}

export interface InterviewPack {
  jobId: string;
  /** What people report about this employer's process. Absent when unresearched. */
  intel: InterviewIntel;
  role: {
    title: string;
    company: string;
    location: string | null;
    applyUrl: string | null;
    screensOn: string[];
    wishlist: string[];
    yearsRequested: number | null;
  };
  whatTheySaw: {
    resumeScore: number | null;
    bullets: string[];
    summary: string | null;
    submittedAt: string | null;
    status: string | null;
  };
  expectToBeProbed: {
    requirement: string;
    match: string;
    importance: string;
    severity: string;
    guidance: string;
    closest: string | null;
  }[];
  likelyQuestions: {
    question: string;
    difficulty: string;
    youHave: string | null;
    guidance?: string;
  }[];
  stories: {
    claimId: string;
    employer: string;
    situation: string;
    answers: string[];
    source: string;
    useWhen: string;
  }[];
  questionsToAsk: string[];
  recruiterThread: {
    from: string | null;
    subject: string | null;
    receivedAt: string | null;
    synopsis: string | null;
    replySentAt: string | null;
  }[];
  notIncluded: string;
}

/**
 * Everything known about one application, assembled for the interview.
 *
 * Contains no company research and no generic question bank — both would have
 * to be invented, and repeating a made-up company fact to someone who works
 * there is worse than saying nothing.
 */
export const getInterviewPack = (jobId: string) =>
  apiFetch<InterviewPack>(`/api/jobs/${encodeURIComponent(jobId)}/interview-pack`);

export interface ReferralPath {
  contactId: string | null;
  name: string | null;
  title: string | null;
  email: string | null;
  score: number;
  why: string[];
  role: "recruiter" | "hiring manager" | "peer";
  shared: string[];
}

export interface ReferralStrategy {
  available: boolean;
  reason?: string;
  detail?: string;
  paths?: ReferralPath[];
  best?: ReferralPath | null;
  plan?: {
    openWith: "direct" | "question";
    steps: { day: number; action: string; why: string }[];
    askForReferral: boolean;
    note: string;
  } | null;
  note?: string;
}

/**
 * Who to approach at this employer, and in what order.
 *
 * Ranks contacts already found — it does not find them. No second-degree
 * connection is ever claimed: CareerOS has no connection graph, and a message
 * built on an invented link falls apart on contact.
 */
export const getReferralStrategy = (jobId: string) =>
  apiFetch<ReferralStrategy>(
    `/api/jobs/${encodeURIComponent(jobId)}/referral-strategy`
  );


/**
 * Draft the outreach for a job — email and LinkedIn message, addressed to the
 * best contact the lookup can find.
 *
 * Autopilot deliberately never does this: each run would spend a provider
 * credit per job across thousands of postings. It is per-job and on request,
 * which is why it needs a button and never had one.
 */
export const draftOutreach = (jobId: string) =>
  apiFetch<OutreachRecord>(`/api/jobs/${encodeURIComponent(jobId)}/outreach`, {
    method: "POST",
  });
