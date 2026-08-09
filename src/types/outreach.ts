export type OutreachChannel = "email" | "linkedin";
export type OutreachStatus =
  | "not_started"
  | "drafted"
  | "queued_manual"
  | "sent"
  | "replied"
  | "no_response";

export interface RecruiterContact {
  id: string;
  name: string;
  title: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  linkedinUrl?: string;
  email?: string;
  emailVerified: boolean;
  confidence: number;
  whySelected: string[];
  channel: OutreachChannel;
  status: OutreachStatus;
  lastContactAt?: string;
  followUpDueAt?: string;
  emailDraft?: string;
  linkedinDraft?: string;
}
