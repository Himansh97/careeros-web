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

export interface CoachTurn {
  ok: boolean;
  reply: string;
  proposals: CoachProposal[];
  blocked?: number;
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
