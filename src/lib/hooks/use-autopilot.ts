"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAutomation, runAutopilot } from "@/lib/api/ops";
import { isLiveApi } from "@/lib/api/client";

/**
 * Starts an autopilot run — discover, score, tailor the strongest matches, and
 * queue them for approval.
 *
 * Shared for the same reason `useTailoring` is: this action is offered from
 * four places (the Automations page, the dashboard header, the top nav, and the
 * command palette) and three of them had been left as
 * "Autopilot isn't connected yet" toasts long after the backend was live. The
 * Automations page owned the only working copy.
 *
 * Nothing here submits an application. A run ends with items in the approval
 * queue, exactly as the scheduled `daily_fetch.py` does.
 */
export function useAutopilot() {
  const queryClient = useQueryClient();
  const [running, setRunning] = React.useState(false);

  // Two "Idle" pills — one in the top nav, one on the dashboard — were static
  // text, so they read Idle during a run and after one. Both now read this.
  const { data: status } = useQuery({
    queryKey: ["automation"],
    queryFn: getAutomation,
    enabled: isLiveApi(),
  });

  const run = React.useCallback(async (): Promise<boolean> => {
    setRunning(true);
    toast.info("Autopilot started — discovering and scoring live postings…");
    const res = await runAutopilot();
    setRunning(false);

    if (!res.ok) {
      toast.error(
        res.reason === "not_connected"
          ? "The CareerOS API isn't reachable"
          : "Autopilot run failed",
        {
          description:
            res.reason === "not_connected"
              ? "Start the backend on port 8000, then try again."
              : res.message ?? "The backend returned an error.",
        }
      );
      return false;
    }

    const s = res.data.stats ?? {};
    toast.success(
      `Run complete — ${s.tailored ?? 0} resumes tailored, ${s.queuedForApproval ?? 0} queued for your approval`
    );
    await queryClient.invalidateQueries({ queryKey: ["automation"] });
    await queryClient.invalidateQueries({ queryKey: ["applications"] });
    await queryClient.invalidateQueries({ queryKey: ["approvals"] });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    return true;
  }, [queryClient]);

  return {
    run,
    running,
    /** True while this tab is running one, or the backend reports one in flight. */
    busy: running || (status?.ok ? status.data.running : false),
    lastRunAt: status?.ok ? (status.data.lastRun?.finishedAt ?? null) : null,
  };
}
