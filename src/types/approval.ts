export type ApprovalKind = "application" | "outreach" | "question" | "sensitive";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "answered";

export interface ApprovalItem {
  criteria?: CommitCriterion[];
  commit?: CommitCall;
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

/**
 * Launch commit criteria for one application.
 *
 * Each criterion reports on its own system, and `holds` marks the ones with
 * authority to stop the launch on their own — the same rule a real launch
 * status check runs on, and the rule this queue has always followed without
 * showing it.
 */
export interface CommitCriterion {
  name: string;
  verdict: "go" | "caution" | "nogo";
  readout: string;
  holds: boolean;
}

export interface CommitCall {
  verdict: "go" | "caution" | "nogo";
  heldBy: string[];
  summary: string;
}
