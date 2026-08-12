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

/**
 * Why a resume is under target, and whether tailoring can close it.
 *
 * Absent once the resume reaches the target. The distinction that matters is
 * `evidenceBound` vs `tailoringBound`: selection and phrasing are ours to
 * improve, requirement coverage is a fact about what the candidate has done.
 */
export interface ResumeShortfall {
  target: number;
  short: number;
  evidenceBound: number;
  tailoringBound: number;
  missing: string[];
  summary: string;
  /**
   * Named actions, not just a number.
   *
   * `fixable: true` means the accomplishment is already on the page and simply
   * doesn't use the posting's word for it — rewording closes the gap.
   * `fixable: false` means nothing backs the requirement, so rewording would
   * be dressing up an absence.
   */
  fixes: {
    requirement: string;
    kind: "reword" | "evidence";
    fixable: boolean;
    action: string;
    detail: string | null;
    weight: number;
  }[];
}

export interface RecruiterAudit {
  overall: number;
  decision: RecruiterDecision;
  categories: RecruiterAuditCategory[];
  whatWorks: string[];
  concerns: string[];
  shortfall?: ResumeShortfall | null;
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
