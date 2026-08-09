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
  /** Drafted but not yet sent — awaiting your approval. */
  emailDraft?: string;
  /** Drafted but not yet sent — always sent manually by you. */
  linkedinDraft?: string;
  /** What was actually sent, kept as a record once status is sent/replied. */
  sentMessage?: OutreachMessage;
  /** The recruiter's reply, when one came back. */
  reply?: OutreachMessage;
}

export interface OutreachMessage {
  body: string;
  at: string;
  channel: OutreachChannel;
}
