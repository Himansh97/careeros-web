"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { submitApplication, type SubmitResult } from "@/lib/api/tsenta";

/**
 * Submitting an application, owned in one place.
 *
 * `useAutopilot` exists because three copies of "Run Autopilot" drifted apart
 * and two of them lied about being connected. The same drift here would not be
 * a cosmetic bug — a second copy of this that forgot to distinguish
 * `needs_review` from `submitted` would tell the candidate an application went
 * out when it did not, and they would stop chasing it.
 *
 * So there is one submit, and every surface calls it.
 *
 * Toasts deliberately differ by outcome rather than collapsing into "done":
 *
 *   submitted     -> it is with the employer, and cannot be recalled
 *   needs_review  -> Tsenta is holding it, and it has NOT been sent
 *   needs_otp     -> the ATS wants a code from the candidate's email
 *   failed        -> with the reason Tsenta actually gave
 */
export function useSubmit() {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = React.useState<string | null>(null);

  const submit = React.useCallback(
    async (jobId: string, opts?: { force?: boolean }): Promise<SubmitResult | null> => {
      setSubmitting(jobId);
      const res = await submitApplication(jobId, opts);
      setSubmitting(null);

      if (!res.ok) {
        toast.error(
          res.reason === "not_connected"
            ? "The CareerOS API isn't reachable"
            : "Couldn't submit",
          {
            description:
              res.reason === "not_connected"
                ? "Start the backend on port 8000, then try again."
                : res.message ?? "The backend returned an error.",
          }
        );
        return null;
      }

      const data = res.data;

      // A refused submission is a normal, useful outcome — most often the
      // eligibility gate catching a role the candidate cannot take. It is
      // shown in full rather than reduced to "failed", because the reason is
      // the entire value of the refusal.
      if (!data.ok) {
        toast.warning("Not submitted", { description: data.reason });
        return data;
      }

      if (data.sent) {
        toast.success(`Submitted to the employer via ${data.ats || "the ATS"}`, {
          description: "This cannot be recalled. It is recorded as submitted.",
        });
      } else if (data.awaitingHuman) {
        toast.info(
          data.status === "needs_otp"
            ? "Tsenta needs a verification code"
            : "Tsenta is holding this for review",
          {
            description:
              data.status === "needs_otp"
                ? "The ATS emailed a code. This has NOT been sent yet."
                : "Accepted but NOT sent. Approve it in Tsenta to release it.",
          }
        );
      } else if (data.status === "failed") {
        toast.error("Tsenta could not submit this", {
          description: data.reason || "No reason given.",
        });
      } else {
        toast.info(`Queued with Tsenta (${data.status || "queued"})`, {
          description: "Not sent yet — it is still working.",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["apply-queue"] });
      return data;
    },
    [queryClient]
  );

  return { submit, submitting };
}
