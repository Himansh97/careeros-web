import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

export interface LiveEvidenceClaim {
  id: string;
  employer: string;
  claim: string;
  skills: string[];
  industry: string;
  dateRange: string;
  classification: string;
  approvedForResume: boolean;
  source: string;
}

export interface LiveProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  workAuthorization: string;
  education: { degree: string; institution: string; graduation_date: string; gpa?: number }[];
  certifications: string[];
  skillsInventory: Record<string, string[]>;
  employmentHistory: { employer: string; title: string; start_date: string; end_date: string }[];
  preferences: Record<string, unknown>;
  applicationAnswers: Record<string, unknown>;
  evidence: LiveEvidenceClaim[];
}

export async function getProfile(): Promise<ApiResult<LiveProfile>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<LiveProfile>("/api/profile");
}
