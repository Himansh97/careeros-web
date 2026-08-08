import { UserCircle } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function CandidateProfilePage() {
  return (
    <StubPage
      title="Candidate Profile"
      description="Your source of truth — personal info, experience, education, skills, certifications, work authorization, and the career evidence library resume tailoring draws from."
      icon={UserCircle}
      emptyTitle="Profile isn't connected yet"
      emptyDescription="This will read from candidate_master_profile.json and career_evidence.json once the profile data layer is wired up — nothing here is fabricated in the meantime."
    />
  );
}
