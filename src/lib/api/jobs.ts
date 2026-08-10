import type { Job, JobSearchFilters } from "@/types/job";
import { mockJobs } from "@/lib/mock/jobs";
import { apiFetch, isLiveApi, isMockData, type ApiResult } from "@/lib/api/client";

export type { ApiResult };

export interface JobSearchResult {
  jobs: Job[];
  total: number;
  new: number;
  /** How many jobs actually received full evidence-based scoring. */
  scored?: number;
  /**
   * Jobs the backend set aside without scoring. Non-zero means the ranking is
   * the best of what was evaluated, not the best of everything found — the UI
   * must not present it as exhaustive.
   */
  setAside?: number;
}

interface LiveSearchResponse {
  jobs: Job[];
  total: number;
  scored: number;
  setAside: number;
  sources: string[];
}

export async function searchJobs(
  filters: JobSearchFilters
): Promise<ApiResult<JobSearchResult>> {
  if (isLiveApi()) {
    const res = await apiFetch<LiveSearchResponse>("/api/jobs/search", {
      method: "POST",
      body: JSON.stringify({
        query: filters.query ?? null,
        location: filters.location ?? null,
        workArrangements: filters.workArrangements ?? null,
        minimumFit: filters.minimumFit ?? null,
        limit: 40,
      }),
    });
    if (!res.ok) return res;
    return {
      ok: true,
      data: {
        jobs: res.data.jobs,
        total: res.data.total,
        new: res.data.jobs.length,
        scored: res.data.scored,
        setAside: res.data.setAside,
      },
    };
  }

  if (!isMockData()) return { ok: false, reason: "not_connected" };

  await simulateLatency();
  const jobs = mockJobs.filter((job) => matchesFilters(job, filters));
  return { ok: true, data: { jobs, total: jobs.length, new: jobs.length } };
}

export async function getJob(id: string): Promise<ApiResult<Job>> {
  if (isLiveApi()) {
    return apiFetch<Job>(`/api/jobs/${encodeURIComponent(id)}`);
  }

  if (!isMockData()) return { ok: false, reason: "not_connected" };

  await simulateLatency();
  const job = mockJobs.find((j) => j.id === id);
  if (!job) return { ok: false, reason: "not_found" };
  return { ok: true, data: job };
}

/**
 * Outcome of pasting a posting link.
 *
 * `blocked` and `unresolved` are ordinary outcomes, not errors: some hosts
 * (LinkedIn, Indeed) prohibit automated access and are refused by name rather
 * than attempted, and plenty of career pages sit on an ATS with no public API.
 * Both cases fall through to pasting the description text, which reaches the
 * identical scoring and tailoring code.
 */
export type ImportedJobResult =
  | {
      kind: "job";
      jobId: string;
      title: string;
      company: string;
      location?: string | null;
      applyUrl?: string | null;
      rawFitScore: number;
      eligibility?: { verdict?: string; blockers?: { detail?: string }[] } | null;
    }
  | { kind: "blocked"; host: string; reason: string }
  | { kind: "unresolved"; reason: string };

interface FromUrlResponse {
  blocked?: boolean;
  unresolved?: boolean;
  host?: string;
  reason?: string;
  jobId?: string;
  title?: string;
  company?: string;
  location?: string | null;
  applyUrl?: string | null;
  rawFitScore?: number;
  eligibility?: { verdict?: string; blockers?: { detail?: string }[] } | null;
}

export async function importJobFromUrl(
  url: string
): Promise<ApiResult<ImportedJobResult>> {
  const res = await apiFetch<FromUrlResponse>("/api/jobs/from-url", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  if (!res.ok) return res;

  const d = res.data;
  if (d.blocked) {
    return {
      ok: true,
      data: { kind: "blocked", host: d.host ?? "", reason: d.reason ?? "" },
    };
  }
  if (d.unresolved || !d.jobId) {
    return { ok: true, data: { kind: "unresolved", reason: d.reason ?? "" } };
  }
  return {
    ok: true,
    data: {
      kind: "job",
      jobId: d.jobId,
      title: d.title ?? "",
      company: d.company ?? "",
      location: d.location,
      applyUrl: d.applyUrl,
      rawFitScore: d.rawFitScore ?? 0,
      eligibility: d.eligibility,
    },
  };
}

/** Import a posting the user pasted as plain text, for hosts we may not fetch. */
export async function importJobFromText(input: {
  title: string;
  company: string;
  description: string;
  applyUrl?: string;
  location?: string;
}): Promise<ApiResult<{ jobId: string }>> {
  const id = `pasted_${Date.now()}`;
  const res = await apiFetch<{ imported: number }>("/api/jobs/import", {
    method: "POST",
    body: JSON.stringify({
      source: "manual-paste",
      jobs: [
        {
          id,
          title: input.title,
          company: input.company,
          description: input.description,
          applyUrl: input.applyUrl ?? "",
          location: input.location ?? "Not specified",
        },
      ],
    }),
  });
  if (!res.ok) return res;
  return { ok: true, data: { jobId: id } };
}

function matchesFilters(job: Job, filters: JobSearchFilters): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    if (!`${job.title} ${job.company.name}`.toLowerCase().includes(q)) return false;
  }
  if (filters.location) {
    if (!job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
  }
  if (filters.workArrangements?.length) {
    if (!filters.workArrangements.includes(job.workArrangement)) return false;
  }
  if (filters.minimumSalary && job.salary) {
    if (job.salary.max < filters.minimumSalary) return false;
  }
  if (filters.sources?.length && !filters.sources.includes(job.source)) return false;
  if (typeof filters.minimumFit === "number") {
    if ((job.rawFitScore ?? 0) < filters.minimumFit) return false;
  }
  return true;
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 220));
}
