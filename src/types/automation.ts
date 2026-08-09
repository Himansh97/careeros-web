export type NodeState = "complete" | "running" | "queued" | "blocked" | "failed" | "idle";

export interface PipelineNode {
  id: string;
  label: string;
  state: NodeState;
  detail?: string;
}

export interface AutomationRules {
  minimumFitToTailor: number;
  minimumResumeScore: number;
  maxApplicationsPerDay: number;
  submissionMode: "approval" | "auto";
  emailMode: "draft" | "approval" | "auto_verified";
  jobRecencyDays: number;
  autoRejectBelowFit: number;
  recruiterConfidenceMinimum: number;
  followUpDelayBusinessDays: number;
}

export const defaultRules: AutomationRules = {
  minimumFitToTailor: 75,
  minimumResumeScore: 90,
  maxApplicationsPerDay: 10,
  submissionMode: "approval",
  emailMode: "approval",
  jobRecencyDays: 7,
  autoRejectBelowFit: 55,
  recruiterConfidenceMinimum: 70,
  followUpDelayBusinessDays: 6,
};
