import { Users } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function ContactsPage() {
  return (
    <StubPage
      title="Contacts"
      description="Every recruiter and hiring contact CareerOS has researched, with confidence scores and source."
      icon={Users}
      emptyTitle="No contacts yet"
      emptyDescription="Recruiter research runs per-application — contacts found there will collect here."
    />
  );
}
