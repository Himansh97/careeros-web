import { Bot } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function AutomationsPage() {
  return (
    <StubPage
      title="Autopilot"
      description="Mission control for the discover → qualify → tailor → audit → apply → outreach → follow-up pipeline."
      icon={Bot}
      emptyTitle="Autopilot isn't connected yet"
      emptyDescription="Pipeline status, per-stage logs, and automation rules (minimum fit, submission mode, daily caps) will live here once automation is wired up."
    />
  );
}
