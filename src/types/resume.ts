export type BulletChangeType = "unchanged" | "added" | "reworded" | "reordered";

export interface BulletEvidence {
  source: string;
  verifiedStatement: string;
  usedToSupport: string;
}

export interface ResumeBullet {
  id: string;
  text: string;
  originalText?: string;
  changeType: BulletChangeType;
  whyChanged?: string;
  evidence?: BulletEvidence;
  /** "user" when the candidate edited this bullet themselves. */
  editedBy?: "system" | "user";
  /** True when the wording goes beyond what the evidence file backs. */
  unverified?: boolean;
  verificationWarnings?: string[];
}

export interface ResumeSection {
  id: string;
  heading: string;
  subheading?: string;
  bullets: ResumeBullet[];
}

export type ResumeStatus = "draft" | "ready" | "approved";

export interface RecruiterAuditCategory {
  key: string;
  label: string;
  score: number;
  max: number;
}

export type RecruiterDecision = "SHORTLIST" | "REVIEW" | "REJECT";

export interface RecruiterAudit {
  overall: number;
  decision: RecruiterDecision;
  categories: RecruiterAuditCategory[];
  whatWorks: string[];
  concerns: string[];
}

export interface ResumeVersion {
  jobId: string;
  jobTitle: string;
  companyName: string;
  version: number;
  status: ResumeStatus;
  rawFitScore: number;
  resumeScore: number;
  scoreHistory: number[];
  sections: ResumeSection[];
  audit: RecruiterAudit;
  updatedAt: string;
  summary?: string;
  headline?: string;
  /** Which document-level fields the candidate has edited by hand. */
  editedFields?: string[];
}
