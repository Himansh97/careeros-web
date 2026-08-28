export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency?: string;
  period?: "year" | "hour";
}

export type WorkArrangement = "remote" | "hybrid" | "onsite";

export type JobSource =
  | "Indeed"
  | "Greenhouse"
  | "Lever"
  | "Ashby"
  | "SmartRecruiters"
  | "Workday"
  | "Company Career Page";

export type ATSPlatform =
  | "Greenhouse"
  | "Lever"
  | "Ashby"
  | "SmartRecruiters"
  | "Workday"
  | "Indeed Apply"
  | "Email";

export type ApplicationStatus =
  | "discovered"
  | "qualified"
  | "tailoring"
  | "ready"
  | "applying"
  | "submitted"
  | "recruiter_contacted"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "closed";

export type RecruiterStatus = "not_searched" | "found" | "contacted" | "replied" | "not_found";

export type RequirementImportance = "required" | "preferred";
export type RequirementMatch = "exact" | "partial" | "gap";

export interface Requirement {
  id: string;
  label: string;
  importance: RequirementImportance;
  match: RequirementMatch;
  evidence?: string;
  source?: string;
}

export interface MatchBreakdown {
  overall: number;
  mandatory: number;
  technical: number;
  experience: number;
  domain: number;
  education: number;
  logistics: number;
}

export interface Job {
  id: string;
  title: string;
  company: Company;
  location: string;
  workArrangement: WorkArrangement;
  salary?: SalaryRange;
  source: JobSource;
  atsPlatform?: ATSPlatform;
  postedAt?: string;
  discoveredAt: string;
  description: string;
  rawFitScore?: number;
  resumeScore?: number;
  applicationStatus: ApplicationStatus;
  /**
   * Whether the candidate can actually take this role, and the posting's own
   * wording that decided it. Present on the job because the submit control has
   * to show the blocker before the click, not report a refusal after it.
   */
  eligibility?: {
    verdict?: string;
    blockers?: { type?: string; detail?: string; quote?: string }[];
  } | null;
  recruiterStatus?: RecruiterStatus;
  requirements: Requirement[];
  matchBreakdown?: MatchBreakdown;
  strongMatches?: string[];
  gaps?: string[];
  saved?: boolean;
  dismissed?: boolean;
  /**
   * Who put this job in the list.
   *
   * "pasted" — the candidate added it, by link or by pasting the description.
   * "fetched" — discovery found it on one of the polled boards.
   *
   * Distinct from `importedNotLive`: a Greenhouse link the candidate pastes is
   * resolved through the board's real API, so it is live, but it is still
   * theirs rather than something the daily run turned up.
   */
  origin?: "pasted" | "fetched";
  /**
   * What the posting screens on, versus what it merely says.
   *
   * Job descriptions mix real requirements with padding and mood language.
   * Presenting them together turns "you meet 5 of 6 things they screen on"
   * into "you meet 5 of 11 things listed" — which is how a qualified
   * candidate talks themselves out of applying.
   */
  /**
   * What is worth doing next — a different question from where you are
   * strongest. Deliberately contains no interview-likelihood term: there is not
   * enough outcome history to compute one honestly, and a number invented from
   * nothing is the failure this system exists to avoid.
   */
  priority?: {
    score: number;
    fit: number;
    friction: { minutes: number; score: number; platform: string; extras: string[]; note: string };
    trust: { score: number; signals: string[]; concerns: string[]; verdict: string };
    freshness: { days: number | null; factor: number; note: string };
    basis: string;
    excludes: string;
  };
  posting?: {
    required: string[];
    preferred: string[];
    yearsRequested: number | null;
    filler: string[];
    screenedOn: number;
    note: string;
  };
  applyUrl: string;
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  workArrangements?: WorkArrangement[];
  minimumSalary?: number;
  datePosted?: "24h" | "7d" | "30d" | "any";
  experienceLevels?: string[];
  employmentTypes?: string[];
  sources?: JobSource[];
  minimumFit?: number;
  sponsorship?: boolean;
}

export type JobSort =
  | "recommended"
  | "priority"
  | "best_fit"
  | "newest"
  | "highest_salary"
  | "recruiter_found";
