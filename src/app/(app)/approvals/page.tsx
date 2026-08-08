import { ShieldCheck } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function ApprovalsPage() {
  return (
    <StubPage
      title="Needs Your Attention"
      description="Applications, outreach, and sensitive questions that require your review before anything goes out."
      icon={ShieldCheck}
      emptyTitle="Nothing needs your attention"
      emptyDescription="Applications ready to submit, outreach ready to send, and questions CareerOS can't answer safely will show up here."
    />
  );
}
