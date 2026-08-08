import { Send } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function OutreachPage() {
  return (
    <StubPage
      title="Recruiter Outreach"
      description="Recruiters CareerOS has identified, with personalized email and LinkedIn drafts."
      icon={Send}
      emptyTitle="No recruiter contacts yet"
      emptyDescription="Once an application is ready, CareerOS will research a relevant recruiter and draft outreach here — LinkedIn messages are always queued for you to send manually."
    />
  );
}
