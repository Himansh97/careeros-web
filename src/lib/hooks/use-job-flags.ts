"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setJobDismissed, setJobSaved } from "@/lib/api/jobs";
import type { Job } from "@/types/job";

/**
 * Save and dismiss, persisted server-side.
 *
 * Previously the jobs page kept these in a `localOverrides` state object and
 * the dashboard did not keep them at all — it fired `toast.success("Job saved")`
 * over nothing. Both claimed a result the system had not produced, which is the
 * one thing this app is not allowed to do.
 *
 * Optimistic: the row updates immediately and rolls back if the write fails,
 * so the toast only ever follows a real change.
 */
export function useJobFlags() {
  const queryClient = useQueryClient();

  const patch = React.useCallback(
    (jobId: string, next: Partial<Job>) => {
      type SearchCache = { ok?: boolean; data?: { jobs?: Job[] } } | undefined;
      queryClient.setQueriesData<SearchCache>({ queryKey: ["jobs"] }, (old) => {
        const res = old as SearchCache;
        if (!res?.ok || !res.data?.jobs) return old;
        return {
          ...res,
          data: {
            ...res.data,
            jobs: res.data.jobs.map((j) => (j.id === jobId ? { ...j, ...next } : j)),
          },
        };
      });
    },
    [queryClient]
  );

  const toggleSave = React.useCallback(
    async (job: Job) => {
      const value = !job.saved;
      patch(job.id, { saved: value });
      const res = await setJobSaved(job.id, value);
      if (!res.ok) {
        patch(job.id, { saved: !value });
        toast.error("Couldn't save that job", {
          description:
            res.reason === "not_connected"
              ? "The CareerOS API isn't reachable — start it on port 8000."
              : "The backend rejected the change.",
        });
        return;
      }
      toast.success(value ? "Job saved" : "Removed from saved");
    },
    [patch]
  );

  const dismiss = React.useCallback(
    async (job: Job) => {
      patch(job.id, { dismissed: true });
      const res = await setJobDismissed(job.id, true);
      if (!res.ok) {
        patch(job.id, { dismissed: false });
        toast.error("Couldn't dismiss that job", {
          description:
            res.reason === "not_connected"
              ? "The CareerOS API isn't reachable — start it on port 8000."
              : "The backend rejected the change.",
        });
        return;
      }
      toast("Job dismissed", {
        action: {
          label: "Undo",
          onClick: async () => {
            patch(job.id, { dismissed: false });
            const undo = await setJobDismissed(job.id, false);
            if (!undo.ok) {
              patch(job.id, { dismissed: true });
              toast.error("Couldn't undo that");
            }
          },
        },
      });
    },
    [patch]
  );

  return { toggleSave, dismiss };
}
