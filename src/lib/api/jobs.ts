import type { Job, JobSearchFilters } from "@/types/job";
import { mockJobs } from "@/lib/mock/jobs";

/**
 * Real API client. No backend exists yet — every function here returns a
 * discriminated result so callers can render an honest "not connected"
 * state instead of pretending data exists (see docs on this decision).
 *
 * Set NEXT_PUBLIC_USE_MOCK_DATA=true (e.g. in .env.local, gitignored) to
 * develop against realistic mock data instead.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_connected" | "not_found" };

function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

export interface JobSearchResult {
  jobs: Job[];
  total: number;
  new: number;
}

export async function searchJobs(
  filters: JobSearchFilters
): Promise<ApiResult<JobSearchResult>> {
  if (!isMockMode()) {
    // POST /api/jobs/search — not implemented; no backend exists yet.
    return { ok: false, reason: "not_connected" };
  }

  await simulateLatency();

  const jobs = mockJobs.filter((job) => matchesFilters(job, filters));

  return {
    ok: true,
    data: { jobs, total: jobs.length, new: jobs.length },
  };
}

export async function getJob(id: string): Promise<ApiResult<Job>> {
  if (!isMockMode()) {
    return { ok: false, reason: "not_connected" };
  }

  await simulateLatency();

  const job = mockJobs.find((j) => j.id === id);
  if (!job) return { ok: false, reason: "not_found" };

  return { ok: true, data: job };
}

function matchesFilters(job: Job, filters: JobSearchFilters): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const haystack = `${job.title} ${job.company.name}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    if (!job.location.toLowerCase().includes(loc)) return false;
  }
  if (filters.workArrangements?.length) {
    if (!filters.workArrangements.includes(job.workArrangement)) return false;
  }
  if (filters.minimumSalary && job.salary) {
    if (job.salary.max < filters.minimumSalary) return false;
  }
  if (filters.sources?.length) {
    if (!filters.sources.includes(job.source)) return false;
  }
  if (typeof filters.minimumFit === "number") {
    if ((job.rawFitScore ?? 0) < filters.minimumFit) return false;
  }
  return true;
}

function simulateLatency() {
  return new Promise((resolve) => setTimeout(resolve, 220));
}
