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
