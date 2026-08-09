import type { PipelineNode } from "@/types/automation";

/** Illustrative mock data — see src/lib/mock/jobs.ts. */
export const mockPipelineNodes: PipelineNode[] = [
  { id: "discover", label: "Discover", state: "complete", detail: "37 jobs found across 3 sources" },
  { id: "deduplicate", label: "Deduplicate", state: "complete", detail: "6 duplicates removed" },
  { id: "analyze", label: "Analyze", state: "complete", detail: "31 job descriptions parsed" },
  { id: "score", label: "Score", state: "complete", detail: "14 above fit threshold" },
  { id: "tailor", label: "Tailor", state: "running", detail: "Tailoring 8 resumes — 5 of 8 done" },
  { id: "audit", label: "Audit", state: "queued", detail: "Waiting on tailoring" },
  { id: "application", label: "Application", state: "queued" },
  { id: "approval", label: "Approval", state: "blocked", detail: "5 items awaiting your review" },
  { id: "submit", label: "Submit", state: "queued", detail: "Requires approval first" },
  { id: "outreach", label: "Outreach", state: "queued" },
  { id: "followup", label: "Follow-up", state: "idle", detail: "Next check in 6 business days" },
];

export const mockTodayStats = [
  { label: "Jobs discovered", value: 37 },
  { label: "Qualified", value: 14 },
  { label: "Resumes tailored", value: 8 },
  { label: "Applications prepared", value: 6 },
  { label: "Applications submitted", value: 4 },
  { label: "Recruiters identified", value: 5 },
  { label: "Messages drafted", value: 5 },
];
