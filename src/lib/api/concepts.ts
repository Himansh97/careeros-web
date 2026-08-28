import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

/**
 * Every technical term on the candidate's own resume, and how well they recall it.
 *
 * The deck is derived server-side from `career_evidence.json` on each request,
 * so it follows the evidence rather than a list anyone has to maintain. 158
 * terms today, 121 of which appear on exactly one claim.
 *
 * A card always carries the claims the term came from, verbatim. `definition`
 * may be empty — general meanings are seeded with sources rather than generated,
 * so a term reaches the deck before anyone has written one. That card still
 * works: what you did with the term is the half that answers the interviewer's
 * follow-up.
 */

export interface ConceptClaim {
  claimId: string;
  employer: string;
  claim: string;
}

export interface ConceptCard {
  term: string;
  claims: ConceptClaim[];
  employers: string[];
  /** Empty until a sourced definition has been seeded for this term. */
  definition: string;
  sources: string[];
  hasDefinition: boolean;
  /** Leitner box, 1–5. Zero means never reviewed. */
  box: number;
  maxBox: number;
  dueAt: string;
  reviewedAt: string;
  due: boolean;
  /** How many claims declare this term. One is the common — and riskiest — case. */
  mentions: number;
}

export interface ConceptOverview {
  total: number;
  unseen: number;
  learning: number;
  known: number;
  due: number;
  withDefinition: number;
  byBox: Record<string, number>;
  maxBox: number;
  boxDays: number[];
}

export type ConceptRating = "again" | "hard" | "good" | "easy";

export interface ReviewResult {
  term: string;
  rating: ConceptRating;
  box: number;
  maxBox: number;
  dueAt: string;
  dueInDays: number;
}

export const listConcepts = () =>
  isLiveApi()
    ? apiFetch<{ overview: ConceptOverview; cards: ConceptCard[] }>("/api/prep/concepts")
    : Promise.resolve<ApiResult<{ overview: ConceptOverview; cards: ConceptCard[] }>>({
        ok: false,
        reason: "not_connected",
      });

export const reviewConcept = (term: string, rating: ConceptRating) =>
  isLiveApi()
    ? apiFetch<ReviewResult>(
        `/api/prep/concepts/${encodeURIComponent(term)}/review`,
        { method: "POST", body: JSON.stringify({ rating }) },
      )
    : Promise.resolve<ApiResult<ReviewResult>>({ ok: false, reason: "not_connected" });
