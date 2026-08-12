import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

/**
 * A single thing the candidate has done.
 *
 * `classification` is the load-bearing field. `IN_PROGRESS_OR_DESIGNED` work is
 * kept deliberately — it stays available for interview conversation — but it
 * can never be written into a resume as delivered, and moving it to
 * `PRESENT_AND_EXPLICIT` requires explicit confirmation because that changes
 * what every future resume is allowed to assert.
 */
export type Classification =
  | "PRESENT_AND_EXPLICIT"
  | "LEARNED_OR_ACADEMIC"
  | "IN_PROGRESS_OR_DESIGNED";

export interface EvidenceClaim {
  claim_id: string;
  employer_or_project: string;
  claim: string;
  skills: string[];
  industry: string;
  date_range: string;
  classification: Classification;
  approved_for_resume: boolean;
  evidence_source: string;
  project?: string;
  added_at?: string;
  updated_at?: string;
  retired_at?: string;
}

export interface NewClaim {
  claim: string;
  employer_or_project: string;
  classification: Classification;
  skills?: string[];
  industry?: string;
  date_range?: string;
  evidence_source?: string;
  project?: string;
}

export async function listEvidence(): Promise<
  ApiResult<{ claims: EvidenceClaim[]; classifications: Classification[]; approvedForResume: number }>
> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch("/api/evidence");
}

export async function addClaim(claim: NewClaim): Promise<ApiResult<EvidenceClaim>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<EvidenceClaim>("/api/evidence", {
    method: "POST",
    body: JSON.stringify(claim),
  });
}

export async function updateClaim(
  claimId: string,
  patch: Partial<NewClaim> & { approved_for_resume?: boolean; confirmDelivered?: boolean }
): Promise<ApiResult<EvidenceClaim>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<EvidenceClaim>(`/api/evidence/${encodeURIComponent(claimId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** Retires rather than deletes — the record of real work is not ours to destroy. */
export async function retireClaim(claimId: string): Promise<ApiResult<EvidenceClaim>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<EvidenceClaim>(`/api/evidence/${encodeURIComponent(claimId)}`, {
    method: "DELETE",
  });
}
