import { Activity } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function ActivityPage() {
  return (
    <StubPage
      title="Activity"
      description="A full, timestamped audit log of every action CareerOS takes on your behalf."
      icon={Activity}
      emptyTitle="No activity yet"
      emptyDescription="Every discovery run, resume tailoring pass, and outreach draft will be logged here, in order."
    />
  );
}
