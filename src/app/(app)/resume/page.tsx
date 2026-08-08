import { FileText } from "lucide-react";
import { StubPage } from "@/components/stub-page";

export default function ResumePage() {
  return (
    <StubPage
      title="Resumes"
      description="Job-specific resume versions, each with a recruiter audit and evidence-backed tailoring."
      icon={FileText}
      emptyTitle="No tailored resumes yet"
      emptyDescription="Tailor a resume from a job's detail page to see it — and its version history — here."
    />
  );
}
