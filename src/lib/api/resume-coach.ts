import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

/**
 * The AI resume corrector.
 *
 * Every proposal arrives with the verdict the containment gate already gave
 * it, from the same function the write path uses — so the badge on screen and
 * what would actually be saved cannot disagree. `applicable: false` means the
 * gate refused it, and the UI must not offer an Apply button that would fail.
 *
 * Rejected proposals are returned deliberately. A caught fabrication is the
 * most informative thing this endpoint produces: it shows the model tried to
 * inflate a claim, and exactly how.
 *
 * A turn may also return `evidenceDrafts`: things the candidate said about
 * their own career that the vault does not hold yet. These are drafts, not
 * writes — every one carries the candidate's own words it came from, the
 * server verified that quote really appears in what they typed, and confirming
 * one is a separate call that stores it *unapproved*. Nothing added this way
 * can reach a resume until it is approved in the Evidence Vault.
 */

export interface CoachFinding {
  code: string;
  /** "reject" | "review" */
  tier: string;
  detail: string;
}

export interface CoachProposal {
  claimId: string;
  employer: string;
  current: string;
  sourceClaim: string;
  proposed: string;
  why: string;
  /** "pass" | "review" | "reject" */
  verdict: string;
  /** "active" | "pending_review" | "rejected" */
  outcome: string;
  findings: CoachFinding[];
  /** False when the gate refused it — Apply would be a lie. */
  applicable: boolean;
  /** True when applying queues it for review rather than putting it on the resume. */
  queued: boolean;
}

/** Something the candidate said about their own career, not yet recorded. */
export interface EvidenceDraft {
  claim: string;
  employer: string;
  skills: string[];
  /** PRESENT_AND_EXPLICIT | LEARNED_OR_ACADEMIC | IN_PROGRESS_OR_DESIGNED */
  classification: string;
  /** Their own words. The server checked this appears in the conversation. */
  quote: string;
}

export interface CoachTurn {
  ok: boolean;
  reply: string;
  proposals: CoachProposal[];
  blocked?: number;
  evidenceDrafts?: EvidenceDraft[];
  /** Mentioned, but not storable — a certification with no issuing body named. */
  draftsNeedingDetail?: number;
  /** How many live postings the wording advice was drawn from, and for what. */
  groundedIn?: { postings: number; skill: string };
  costUsd?: number;
  /** Why nothing came back: no key, spent budget, unreadable response. */
  reason?: string;
}

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export async function coachResume(
  jobId: string,
  instruction: string,
  history: CoachMessage[],
): Promise<ApiResult<CoachTurn>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<CoachTurn>(`/api/jobs/${jobId}/resume/coach`, {
    method: "POST",
    body: JSON.stringify({ instruction, history }),
  });
}

export interface ApplyProposalResult {
  ok: boolean;
  verdict: string;
  queued: boolean;
  warnings?: string[];
  problems?: string[];
  original: string;
}

export async function applyCoachProposal(
  jobId: string,
  proposal: Pick<CoachProposal, "claimId" | "proposed" | "why">,
): Promise<ApiResult<ApplyProposalResult>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<ApplyProposalResult>(`/api/jobs/${jobId}/resume/coach/apply`, {
    method: "POST",
    body: JSON.stringify({
      claimId: proposal.claimId,
      text: proposal.proposed,
      why: proposal.why,
    }),
  });
}

export interface AddedClaim {
  claim_id: string;
  claim: string;
  employer_or_project: string;
  classification: string;
  approved_for_resume: boolean;
}

/**
 * Record something the candidate stated, unapproved.
 *
 * The conversation goes with the request because the server re-verifies the
 * quote against it rather than trusting the draft. That check guards the
 * endpoint, which is reachable without going through a coaching turn at all.
 */
export async function addCoachEvidence(
  jobId: string,
  draft: EvidenceDraft,
  instruction: string,
  history: CoachMessage[],
): Promise<ApiResult<AddedClaim>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<AddedClaim>(`/api/jobs/${jobId}/resume/coach/evidence`, {
    method: "POST",
    body: JSON.stringify({ ...draft, instruction, history }),
  });
}
