import { SlidersHorizontal } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function PreferencesPage() {
  return (
    <StubPage
      title="Preferences"
      description="Target roles, locations, salary floor, employment type, and application answer defaults."
      icon={SlidersHorizontal}
      emptyTitle="Preferences aren't connected yet"
      emptyDescription="This will read from job_preferences.yaml and application_answers.yaml once the preferences data layer is wired up."
    />
  );
}
