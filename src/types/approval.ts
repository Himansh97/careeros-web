export type ApprovalKind = "application" | "outreach" | "question" | "sensitive";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "answered";

export interface ApprovalItem {
  id: string;
  kind: ApprovalKind;
  jobId: string;
  jobTitle: string;
  companyName: string;
  title: string;
  whatCareerOSWantsToDo: string;
  whyApprovalRequired: string;
  riskConfidence?: number;
  dataToSubmit?: string[];
  rawFitScore?: number;
  resumeScore?: number;
  question?: string;
  createdAt: string;
  status: ApprovalStatus;
}
