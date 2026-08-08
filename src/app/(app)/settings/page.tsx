import { Settings } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function SettingsPage() {
  return (
    <StubPage
      title="Settings"
      description="Account, notification, and general product settings."
      icon={Settings}
      emptyTitle="Nothing to configure yet"
      emptyDescription="General settings will appear here as the product grows beyond candidate profile and preferences."
    />
  );
}
