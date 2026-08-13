import { PreflightBoard } from "@/components/preflight/preflight-board";

/**
 * The pre-flight poll.
 *
 * This used to be `/` — the product opened straight into a launch-commit
 * check, with no page before it explaining what was being launched. The
 * landing page now holds that ground and its primary action points here, which
 * is the order the metaphor always implied: read the board, then commit.
 *
 * Unchanged otherwise: real checks against the real backend, station by
 * station, any single NO-GO holding the commit. It hands off to the dashboard
 * on its own and can be skipped with Escape.
 */
export default function LaunchPage() {
  return <PreflightBoard />;
}
