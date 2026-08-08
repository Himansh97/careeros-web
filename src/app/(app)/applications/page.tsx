import { Briefcase } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function ApplicationsPage() {
  return (
    <StubPage
      title="Applications"
      description="Track every application from qualified through offer, in board or table view."
      icon={Briefcase}
      emptyTitle="No applications yet"
      emptyDescription="The strongest jobs you approve for tailoring will show up here as they move through the pipeline."
    />
  );
}
