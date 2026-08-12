import { PreflightBoard } from "@/components/preflight/preflight-board";

/**
 * The entrance.
 *
 * This was `redirect("/dashboard")` — a route that existed only to leave. It
 * now runs the pre-flight poll: real checks against the real backend, reported
 * station by station, with any single NO-GO holding the commit.
 *
 * It hands off to the dashboard on its own, skips on Escape or the Skip
 * control, and runs once per browser session.
 */
export default function RootPage() {
  return <PreflightBoard />;
}
