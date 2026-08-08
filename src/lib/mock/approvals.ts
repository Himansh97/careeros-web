import type { ApprovalItem } from "@/types/approval";

/**
 * Illustrative mock data — see src/lib/mock/jobs.ts. Every item traces to
 * one of the mock jobs/resumes already defined so the numbers stay
 * internally consistent.
 */
export const mockApprovals: ApprovalItem[] = [
  {
    id: "appr_notion_application",
    kind: "application",
    jobId: "job_notion_ba",
    jobTitle: "Business Analyst, Operations",
    companyName: "Notion",
    title: "Application ready to submit",
    whatCareerOSWantsToDo:
      "Submit this application through Ashby with the approved resume (V2, score 94) attached.",
    whyApprovalRequired:
      "Submitting an application is a consequential, hard-to-reverse action under your name — it always waits for your review, even at a high fit score.",
    dataToSubmit: [
      "Resume V2 (approved) — resume_score 94",
      "Contact info: name, email, phone",
      "Work authorization: OPT (F-1), no sponsorship required",
    ],
    rawFitScore: 91,
    resumeScore: 94,
    createdAt: "2026-08-08T19:05:00Z",
    status: "pending",
  },
  {
    id: "appr_datadog_outreach",
    kind: "outreach",
    jobId: "job_datadog_de",
    jobTitle: "Data Engineer",
    companyName: "Datadog",
    title: "Recruiter email ready to send",
    whatCareerOSWantsToDo:
      "Send a personalized email to the recruiter who posted this role, referencing the tailored Data Engineer resume and the pipeline work at Supreme Lending.",
    whyApprovalRequired:
      "Outreach is drafted for your review — nothing sends automatically, even with a verified recruiter contact.",
    dataToSubmit: ["Email draft (118 words)", "LinkedIn connection note (61 words)"],
    riskConfidence: 88,
    createdAt: "2026-08-08T18:40:00Z",
    status: "pending",
  },
  {
    id: "appr_attio_question",
    kind: "question",
    jobId: "job_attio_data_analyst",
    jobTitle: "Data Analyst",
    companyName: "Attio",
    title: "Sponsorship question needs an answer",
    whatCareerOSWantsToDo: "Answer this application question before the Attio application can proceed.",
    whyApprovalRequired:
      "Sponsorship questions are legally consequential — CareerOS never guesses or reuses a default answer without your confirmation for each application.",
    question: "Will you now or in the future require sponsorship to work in this position?",
    createdAt: "2026-08-06T09:15:00Z",
    status: "pending",
  },
  {
    id: "appr_rippling_sensitive",
    kind: "sensitive",
    jobId: "job_rippling_pm",
    jobTitle: "Technical Program Manager, Data Platform",
    companyName: "Rippling",
    title: "Experience requirement gap flagged",
    whatCareerOSWantsToDo:
      "Flagging before spending effort on tailoring: this posting states a 6+ years program-management requirement, and elapsed relevant experience is ~3 years.",
    whyApprovalRequired:
      "A hard requirement gap should be a deliberate choice to pursue anyway, not something CareerOS quietly proceeds past.",
    riskConfidence: 60,
    rawFitScore: 74,
    createdAt: "2026-08-08T14:05:00Z",
    status: "pending",
  },
  {
    id: "appr_stripe_sensitive",
    kind: "sensitive",
    jobId: "job_stripe_ai_eng",
    jobTitle: "AI Engineer, Internal Tools",
    companyName: "Stripe",
    title: "Weak fit — confirm before tailoring",
    whatCareerOSWantsToDo:
      "Raw fit for this role is 58/100, below the usual apply threshold — mainly because TensorFlow/PyTorch and production ML infrastructure at scale aren't evidenced anywhere in your history.",
    whyApprovalRequired:
      "Tailoring a resume for a role this far below threshold would mean either spending effort on a long shot or, worse, being tempted to overstate fit — better to confirm intent first.",
    riskConfidence: 42,
    rawFitScore: 58,
    createdAt: "2026-08-05T11:20:00Z",
    status: "pending",
  },
];
