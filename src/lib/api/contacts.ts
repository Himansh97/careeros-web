import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

export interface LiveContact {
  id: string;
  jobId: string | null;
  company: string;
  name: string;
  title: string | null;
  email: string | null;
  emailVerified: boolean;
  linkedinUrl: string | null;
  confidence: number;
  provider: string;
  whySelected: string | null;
  status: string;
  createdAt: string;
}

/**
 * A person as the lookup returns them — not yet a saved contact.
 *
 * Distinct from `LiveContact`, which is a stored record with an id, a job and
 * a status. Conflating the two hides that one is a search result and the other
 * is something the candidate has decided to keep.
 */
export interface FoundPerson {
  name: string;
  title: string;
  email: string | null;
  confidence: number;
  emailVerified: boolean;
  linkedinUrl: string | null;
  isRecruiter: boolean;
  provider: string;
  /** Position after ranking — 1 is the best path in. */
  rank?: number;
  /** 0-100, from title against the role, seniority and shared background. */
  rankScore?: number;
  rankWhy?: string[];
}

export interface ContactLookupResult {
  available: boolean;
  reason?: string;
  detail?: string;
  domain?: string;
  organization?: string | null;
  note?: string;
  company?: string;
  jobId?: string;
  contacts: FoundPerson[];
  /** How many score highly enough to be worth writing to. */
  worthContacting?: number;
}

export async function listContacts(): Promise<
  ApiResult<{ contacts: LiveContact[]; lookupEnabled: boolean }>
> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch("/api/contacts");
}

export async function lookupContactsForJob(
  jobId: string
): Promise<ApiResult<ContactLookupResult>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch(`/api/jobs/${encodeURIComponent(jobId)}/contacts`);
}

export async function saveContact(
  payload: Partial<LiveContact> & { company: string; name: string }
): Promise<ApiResult<LiveContact>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch("/api/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
