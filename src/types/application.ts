import type { Company, JobSource, RecruiterStatus } from "@/types/job";

export type PipelineStatus =
  | "qualified"
  | "tailoring"
  | "ready"
  | "applying"
  | "submitted"
  | "recruiter_contacted"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: string;
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  title: string;
  company: Company;
  location: string;
  source: JobSource;
  status: PipelineStatus;
  rawFitScore: number;
  resumeScore?: number;
  recruiterStatus?: RecruiterStatus;
  recruiterName?: string;
  submittedAt?: string;
  nextAction: string;
  timeline: TimelineEvent[];
}

export const pipelineColumns: { value: PipelineStatus; label: string }[] = [
  { value: "qualified", label: "Qualified" },
  { value: "tailoring", label: "Tailoring" },
  { value: "ready", label: "Ready" },
  { value: "applying", label: "Applying" },
  { value: "submitted", label: "Submitted" },
  { value: "recruiter_contacted", label: "Recruiter Contacted" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];
