import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

/**
 * Three things a day, taken from what the staged pipeline is asking for.
 *
 * Not the resume deck. The deck is 158 terms written once; this is what thirty
 * live postings are asking about right now, ordered by how many of them name
 * each one. `demand` is that count and it is the whole argument for the item
 * being here.
 *
 * `kind` decides where the item goes. A definable requirement gets a concept
 * card. A behavioural one — and the two most-demanded requirements in the whole
 * pipeline are behavioural — goes to the STAR drill in /prep, because "explain
 * stakeholder management" is a question nobody wants answered.
 */

export interface RoundItem {
  term: string;
  /** How many staged jobs name this requirement. */
  demand: number;
  kind: "concept" | "behavioural";
  /** Set for behavioural items: the /prep question to answer instead. */
  questionId: string;
  companies: string[];
  box: number;
  /** False when no card has been written for this term yet. */
  hasCard: boolean;
}

export interface RoundState {
  day: string;
  items: RoundItem[];
  completed: boolean;
  scored: number;
  streak: number;
  total: number;
}

export const getRound = () =>
  isLiveApi()
    ? apiFetch<RoundState>("/api/prep/round")
    : Promise.resolve<ApiResult<RoundState>>({ ok: false, reason: "not_connected" });

export const completeRound = (scored: number) =>
  isLiveApi()
    ? apiFetch<RoundState>("/api/prep/round/complete", {
        method: "POST",
        body: JSON.stringify({ scored }),
      })
    : Promise.resolve<ApiResult<RoundState>>({ ok: false, reason: "not_connected" });
