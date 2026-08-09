"use client";

import { toast } from "sonner";
import { Mail, Link2, ShieldCheck, ShieldAlert, Copy, CornerDownLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { RecruiterContact } from "@/types/outreach";

export function ContactPanel({ contact }: { contact: RecruiterContact }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{contact.name}</h2>
        <p className="text-sm text-muted-foreground">{contact.title}</p>
        <p className="text-sm text-muted-foreground">{contact.companyName}</p>
      </div>

      <div className="space-y-1.5 text-xs">
        {contact.linkedinUrl && (
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <Link2 className="size-3.5" strokeWidth={1.75} />
            LinkedIn profile
          </a>
        )}
        <div className="flex items-center gap-1.5">
          {contact.email ? (
            <>
              {contact.emailVerified ? (
                <ShieldCheck className="size-3.5 text-primary" strokeWidth={1.75} />
              ) : (
                <ShieldAlert className="size-3.5 text-[oklch(0.6_0.15_70)]" strokeWidth={1.75} />
              )}
              <span className="text-foreground">{contact.email}</span>
              <Badge variant="secondary" className="font-normal">
                {contact.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </>
          ) : (
            <span className="text-muted-foreground">
              No email found — not inferring one
            </span>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Relationship confidence</span>
          <span className="font-medium tabular-nums text-foreground">{contact.confidence}%</span>
        </div>
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Why selected
        </h3>
        <ul className="space-y-1">
          {contact.whySelected.map((reason, i) => (
            <li key={i} className="text-xs text-foreground/80">— {reason}</li>
          ))}
        </ul>
      </div>

      {contact.emailDraft && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email draft
          </h3>
          <Textarea readOnly value={contact.emailDraft} rows={9} className="text-xs" />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                toast.info("Sending needs a connected email integration — drafts never send automatically.")
              }
            >
              <Mail className="size-3.5" strokeWidth={1.75} />
              Approve & Send
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(contact.emailDraft ?? "");
                toast.success("Email draft copied");
              }}
            >
              <Copy className="size-3.5" strokeWidth={1.75} />
              Copy
            </Button>
          </div>
        </div>
      )}

      {contact.linkedinDraft && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            LinkedIn draft
          </h3>
          <Textarea readOnly value={contact.linkedinDraft} rows={5} className="text-xs" />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            LinkedIn messages are always sent manually — no automation exists or is planned.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => {
              navigator.clipboard?.writeText(contact.linkedinDraft ?? "");
              toast.success("LinkedIn draft copied — paste it into LinkedIn to send");
            }}
          >
            <Copy className="size-3.5" strokeWidth={1.75} />
            Copy for manual send
          </Button>
        </div>
      )}

      {(contact.sentMessage || contact.reply) && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Conversation
          </h3>
          <div className="space-y-2">
            {contact.sentMessage && (
              <MessageBubble
                label="You sent"
                at={contact.sentMessage.at}
                body={contact.sentMessage.body}
              />
            )}
            {contact.reply && (
              <MessageBubble
                label={`${contact.name.split(" ")[0]} replied`}
                at={contact.reply.at}
                body={contact.reply.body}
                inbound
              />
            )}
          </div>

          {contact.reply ? (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <CornerDownLeft className="mt-0.5 size-3 shrink-0" strokeWidth={1.75} />
              Follow-ups are cancelled automatically once a recruiter replies.
            </p>
          ) : (
            contact.followUpDueAt && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="mt-0.5 size-3 shrink-0" strokeWidth={1.75} />
                No reply yet — follow-up scheduled for{" "}
                {new Date(contact.followUpDueAt).toLocaleDateString()}.
              </p>
            )
          )}
        </div>
      )}

      {!contact.emailDraft &&
        !contact.linkedinDraft &&
        !contact.sentMessage &&
        !contact.reply && (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No outreach drafted yet for this contact.
          </p>
        )}
    </div>
  );
}

function MessageBubble({
  label,
  at,
  body,
  inbound,
}: {
  label: string;
  at: string;
  body: string;
  inbound?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        inbound ? "border-primary/25 bg-primary/5" : "border-border bg-muted/40"
      }`}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">
          {new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
