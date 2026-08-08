import type { ResumeVersion } from "@/types/resume";
import { mockResumes } from "@/lib/mock/resumes";
import type { ApiResult } from "@/lib/api/jobs";

function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

export async function getResume(jobId: string): Promise<ApiResult<ResumeVersion>> {
  if (!isMockMode()) {
    return { ok: false, reason: "not_connected" };
  }
  await new Promise((resolve) => setTimeout(resolve, 200));

  const resume = mockResumes[jobId];
  if (!resume) return { ok: false, reason: "not_found" };

  return { ok: true, data: resume };
}

export async function listResumes(): Promise<ApiResult<ResumeVersion[]>> {
  if (!isMockMode()) {
    return { ok: false, reason: "not_connected" };
  }
  await new Promise((resolve) => setTimeout(resolve, 200));

  return { ok: true, data: Object.values(mockResumes) };
}
