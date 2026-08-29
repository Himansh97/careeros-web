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

/**
 * A diagram the shared renderer knows how to draw.
 *
 * Four of these draw boxes, which is honest when the content really is a
 * sequence or a set of alternatives. The other four carry meaning in a visual
 * channel — diverging lines, opacity, plotted paths, length — which is the only
 * thing that makes a picture worth the space it takes.
 */
export type ConceptVisual = import("@/components/diagram/diagram").DiagramSpec;

export interface ConceptCard {
  term: string;
  /** Empty on a topic card — those are not on the resume and have no claim. */
  claims: ConceptClaim[];
  employers: string[];
  /** Empty until a sourced definition has been seeded for this term. */
  definition: string;
  sources: string[];
  hasDefinition: boolean;
  /** The plain-English restatement. */
  simple: string;
  /** The same, in Hindi. Needs `.font-devanagari` — Geist has no Devanagari. */
  hindi: string;
  /** Where the concept shows up in practice, and its honest limits. */
  application: string;
  visual: ConceptVisual | null;
  /** Which layers a model restated rather than a source asserting them. */
  derived: string[];
  /** How many of the five layers are filled. */
  layers: number;
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

export interface ConceptTopic {
  slug: string;
  title: string;
  blurb: string;
  terms: string[];
}

/**
 * Subjects to study beyond the resume.
 *
 * The resume deck answers "can you defend what you wrote". These answer "do you
 * know the field you say you work in" — the questions that do not quote your own
 * bullet back at you.
 */
export const listTopics = () =>
  isLiveApi()
    ? apiFetch<{ topics: ConceptTopic[] }>("/api/prep/concepts/topics")
    : Promise.resolve<ApiResult<{ topics: ConceptTopic[] }>>({
        ok: false,
        reason: "not_connected",
      });

export const getTopic = (slug: string) =>
  isLiveApi()
    ? apiFetch<ConceptTopic & { cards: ConceptCard[] }>(
        `/api/prep/concepts/topics/${encodeURIComponent(slug)}`,
      )
    : Promise.resolve<ApiResult<ConceptTopic & { cards: ConceptCard[] }>>({
        ok: false,
        reason: "not_connected",
      });
