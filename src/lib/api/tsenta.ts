/**
 * The submit path. This is the only client module that reaches an employer.
 *
 * `ok` does not mean sent, and nothing in this file lets a caller pretend
 * otherwise. Tsenta accepts an application and then may hold it at
 * `needs_review` (the account has review-before-submit on, or Tsenta was
 * unsure of a field) or `needs_otp` (the ATS wants a code from the
 * candidate's email). Both are successful requests for applications that have
 * NOT gone anywhere. Only `status === "submitted"` means an employer has it.
 *
 * That distinction is load-bearing: CareerOS has already shipped a bug where
 * two vocabularies for "applied" disagreed and six genuinely-sent applications
 * were rewound and offered back to be sent again. `sent` is therefore a
 * computed field here rather than a thing any component decides for itself.
 */
import { apiFetch } from "./client";

export type TsentaStatus =
  | "queued"
  | "running"
  | "needs_review"
  | "needs_otp"
  | "submitted"
  | "failed";

export interface SubmitResult {
  jobId: string;
  ok: boolean;
  /** True only for a literal `submitted`. Never infer this from `ok`. */
  sent: boolean;
  status: TsentaStatus | "";
  applicationId: string;
  ats: string;
  priceUsd: number;
  reason: string;
  /** Accepted, but sitting with a human — review or an OTP. Not sent. */
  awaitingHuman: boolean;
}

export interface ReviewResult {
  ok: boolean;
  sent: boolean;
  status: TsentaStatus | "";
  reason: string;
}

/**
 * Send one application. Irreversible on success.
 *
 * `force` overrides the eligibility gate and must only ever be passed from an
 * explicit human action that displayed the blocking reason first.
 */
export async function submitApplication(jobId: string, opts?: { force?: boolean }) {
  return apiFetch<SubmitResult>(`/api/jobs/${encodeURIComponent(jobId)}/submit`, {
    method: "POST",
    body: JSON.stringify({ force: opts?.force ?? false }),
  });
}

/** Where a submission got to. Read-only — sends nothing. */
export async function getSubmissionStatus(applicationId: string) {
  return apiFetch<Omit<SubmitResult, "jobId" | "applicationId" | "awaitingHuman">>(
    `/api/tsenta/applications/${encodeURIComponent(applicationId)}`
  );
}

/**
 * Release or kill an application Tsenta is holding at `needs_review`.
 * Approving here sends it, so it is as irreversible as submitting.
 */
export async function reviewSubmission(
  applicationId: string,
  decision: "approve" | "reject",
  note = ""
) {
  return apiFetch<ReviewResult>(
    `/api/tsenta/applications/${encodeURIComponent(applicationId)}/review`,
    { method: "POST", body: JSON.stringify({ decision, note }) }
  );
}
