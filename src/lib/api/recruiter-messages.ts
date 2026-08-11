import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";
import type {
  RecruiterDraftPatch,
  RecruiterMessage,
  RecruiterReplyDraft,
  RecruiterReplyDraftReview,
} from "@/types/recruiter-message";

export async function listRecruiterMessages(
  applicationId?: string
): Promise<ApiResult<RecruiterMessage[]>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };

  const query = applicationId
    ? `?applicationId=${encodeURIComponent(applicationId)}`
    : "";
  const result = await apiFetch<{ messages: RecruiterMessage[] }>(
    `/api/recruiter-messages${query}`
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.messages };
}

export async function getRecruiterMessage(
  id: string
): Promise<ApiResult<RecruiterMessage>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch(`/api/recruiter-messages/${encodeURIComponent(id)}`);
}

export async function updateRecruiterDraft(
  id: string,
  patch: RecruiterDraftPatch
): Promise<ApiResult<RecruiterReplyDraft>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch(`/api/recruiter-messages/${encodeURIComponent(id)}/draft`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function approveRecruiterDraft(
  id: string
): Promise<ApiResult<RecruiterReplyDraftReview>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch(`/api/recruiter-messages/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function dismissRecruiterDraft(
  id: string
): Promise<ApiResult<RecruiterReplyDraftReview>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch(`/api/recruiter-messages/${encodeURIComponent(id)}/dismiss`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function retryRecruiterDraft(
  id: string
): Promise<ApiResult<RecruiterReplyDraftReview>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch(`/api/recruiter-messages/${encodeURIComponent(id)}/retry`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
