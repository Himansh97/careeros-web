export type RecruiterDraftStatus =
  | "awaiting_approval"
  | "approved"
  | "creating"
  | "created"
  | "dismissed"
  | "failed";

export interface RecruiterReplyDraft {
  id: string;
  gmailMessageId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  status: RecruiterDraftStatus;
  approvedAt: string | null;
  gmailDraftId: string | null;
  createdAt: string;
  updatedAt: string;
  contentFingerprint: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
}

export interface RecruiterMessage {
  gmailMessageId: string;
  applicationId: string | null;
  senderName: string;
  senderEmail: string;
  subject: string;
  receivedAt: string;
  classification: string;
  synopsis: string;
  gmailUrl: string;
  createdAt: string;
  updatedAt: string;
  draft: RecruiterReplyDraft | null;
}

export type RecruiterDraftPatch = Partial<
  Pick<RecruiterReplyDraft, "to" | "cc" | "bcc" | "subject" | "body">
>;

/** Draft fields returned by candidate-review mutation endpoints. */
export type RecruiterReplyDraftReview = Omit<
  RecruiterReplyDraft,
  "gmailMessageId" | "gmailDraftId"
>;
