import { Bookmark } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function SavedSearchesPage() {
  return (
    <StubPage
      title="Saved Searches"
      description="Searches you save can automatically rerun and surface new matches."
      icon={Bookmark}
      emptyTitle="No saved searches yet"
      emptyDescription="Save a search from the Discover Jobs page to have CareerOS rerun it automatically."
    />
  );
}
