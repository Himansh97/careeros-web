"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getResume } from "@/lib/api/resumes";

export type TailorIntent = "resume" | "application";

/**
 * Runs resume tailoring for a job against the backend.
 *
 * The same backend run does three things — builds the tailored resume,
 * upserts the application record, and raises the approval that gates
 * applying — so "Tailor Resume" and "Prepare Application" both call it and
 * differ only in where they navigate afterwards.
 *
 * Shared because the job detail page and the split-pane job panel both offer
 * these actions, and they drifted apart once already: both were left as
 * "isn't connected yet" toasts long after the backend was live.
 */
export function useTailoring(jobId: string) {
  const queryClient = useQueryClient();
  const [running, setRunning] = React.useState<TailorIntent | null>(null);

  const run = React.useCallback(
    async (intent: TailorIntent): Promise<boolean> => {
      setRunning(intent);
      const res = await getResume(jobId);
      setRunning(null);

      if (!res.ok) {
        toast.error(
          res.reason === "not_connected"
            ? "The CareerOS API isn't reachable"
            : "Tailoring failed",
          {
            description:
              res.reason === "not_connected"
                ? "Start the backend on port 8000, then try again."
                : res.message ?? "The backend returned an error.",
          }
        );
        return false;
      }

      // The job's resumeScore and the application pipeline both change here.
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      // Seed the workspace's cache so navigating there doesn't re-run tailoring.
      queryClient.setQueryData(["resume", jobId], res);
      return true;
    },
    [jobId, queryClient]
  );

  return { run, running, busy: running !== null };
}
