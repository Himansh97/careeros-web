import { Search } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function JobsPage() {
  return (
    <StubPage
      title="Discover Jobs"
      description="Search Indeed, Greenhouse, Lever, and other supported sources for roles that fit your profile."
      icon={Search}
      emptyTitle="Job discovery isn't connected yet"
      emptyDescription="Search filters, results, and fit scoring will appear here once job discovery is wired up to a live source."
    />
  );
}
