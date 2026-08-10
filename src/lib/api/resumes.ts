import type { ResumeVersion } from "@/types/resume";
import { mockResumes } from "@/lib/mock/resumes";
import { apiFetch, isLiveApi, isMockData, type ApiResult } from "@/lib/api/client";

/**
 * Against the live backend, "get" performs the tailoring run — the resume is
 * generated on demand from the candidate's real evidence rather than stored.
 */
export async function getResume(jobId: string): Promise<ApiResult<ResumeVersion>> {
  if (isLiveApi()) {
    return apiFetch<ResumeVersion>(`/api/jobs/${encodeURIComponent(jobId)}/tailor`, {
      method: "POST",
    });
  }

  if (!isMockData()) return { ok: false, reason: "not_connected" };

  await new Promise((r) => setTimeout(r, 200));
  const resume = mockResumes[jobId];
  if (!resume) return { ok: false, reason: "not_found" };
  return { ok: true, data: resume };
}

export interface BulletEditResult {
  ok: true;
  /**
   * Reasons the edit isn't supported by the underlying evidence claim. The
   * edit is still saved — it's the candidate's own history, and they may know
   * things the evidence file doesn't record. The resume marks it unverified.
   */
  warnings: string[];
  original: string;
}

/** Save an edited bullet for one job's resume. */
export async function editBullet(
  jobId: string,
  claimId: string,
  text: string
): Promise<ApiResult<BulletEditResult>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<BulletEditResult>(
    `/api/jobs/${encodeURIComponent(jobId)}/resume/bullets/${encodeURIComponent(claimId)}`,
    { method: "PUT", body: JSON.stringify({ text }) }
  );
}

/** Drop your edit to a bullet, falling back to the tailored wording. */
export async function revertBullet(
  jobId: string,
  claimId: string
): Promise<ApiResult<{ ok: true }>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<{ ok: true }>(
    `/api/jobs/${encodeURIComponent(jobId)}/resume/bullets/${encodeURIComponent(claimId)}`,
    { method: "DELETE" }
  );
}

/** Save an edited summary or headline. */
export async function editResumeField(
  jobId: string,
  field: "summary" | "headline",
  text: string
): Promise<ApiResult<{ ok: true }>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<{ ok: true }>(
    `/api/jobs/${encodeURIComponent(jobId)}/resume/${field}`,
    { method: "PUT", body: JSON.stringify({ text }) }
  );
}

/** Undo all of your edits, keeping the tailored resume underneath. */
export async function resetResumeEdits(
  jobId: string
): Promise<ApiResult<{ ok: true }>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<{ ok: true }>(
    `/api/jobs/${encodeURIComponent(jobId)}/resume/edits`,
    { method: "DELETE" }
  );
}

export async function listResumes(): Promise<ApiResult<ResumeVersion[]>> {
  if (isLiveApi()) {
    // Resumes are generated per job on demand, so the list view derives from
    // applications that already have a resume score.
    const res = await apiFetch<{ applications: { jobId: string; title: string; company: { name: string }; rawFitScore: number; resumeScore: number | null }[] }>(
      "/api/applications"
    );
    if (!res.ok) return res;
    const withResumes = res.data.applications.filter((a) => a.resumeScore !== null);
    return {
      ok: true,
      data: withResumes.map((a) => ({
        jobId: a.jobId,
        jobTitle: a.title,
        companyName: a.company.name,
        version: 1,
        status: "ready" as const,
        rawFitScore: a.rawFitScore,
        resumeScore: a.resumeScore ?? 0,
        scoreHistory: [a.resumeScore ?? 0],
        sections: [],
        audit: {
          overall: a.resumeScore ?? 0,
          decision: "REVIEW" as const,
          categories: [],
          whatWorks: [],
          concerns: [],
        },
        updatedAt: "",
      })),
    };
  }

  if (!isMockData()) return { ok: false, reason: "not_connected" };

  await new Promise((r) => setTimeout(r, 200));
  return { ok: true, data: Object.values(mockResumes) };
}
