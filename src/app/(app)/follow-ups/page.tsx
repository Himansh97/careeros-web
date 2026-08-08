import { BellRing } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function FollowUpsPage() {
  return (
    <StubPage
      title="Follow-ups"
      description="Scheduled follow-ups after recruiter outreach, timed and tracked automatically."
      icon={BellRing}
      emptyTitle="No follow-ups scheduled"
      emptyDescription="Follow-ups get scheduled automatically a few business days after outreach goes out — none has been sent yet."
    />
  );
}
