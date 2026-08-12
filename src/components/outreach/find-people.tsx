"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Loader2, Mail, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { lookupContactsForJob, type FoundPerson } from "@/lib/api/contacts";

/**
 * Find the people you could actually write to at this employer.
 *
 * The lookup endpoint has existed the whole time and nothing in the interface
 * ever called it. So `ReferralPlan` rendered nothing on every job — it ranks
 * saved contacts, and no contacts were ever saved because there was no way to
 * ask. The capability was complete and unreachable.
 *
 * LinkedIn is deliberately a search link rather than an integration. Their
 * terms prohibit automated access, so CareerOS finds the name and the exact
 * title and hands you a search — the last step is yours, on purpose.
 */
export function FindPeople({
  jobId,
  company,
}: {
  jobId: string;
  company: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [contacts, setContacts] = React.useState<FoundPerson[] | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  async function find() {
    setOpen(true);
    if (contacts || loading) return;
    setLoading(true);
    setProblem(null);

    const res = await lookupContactsForJob(jobId);
    setLoading(false);

    if (!res.ok) {
      setProblem(
        res.reason === "not_connected"
          ? "The CareerOS API isn't reachable — start it on port 8000."
          : "The lookup failed."
      );
      return;
    }
    const found = res.data.contacts ?? [];
    setContacts(found);
    // The lookup persists what it found, so the referral plan on this page can
    // rank it. Without this the plan keeps saying "no contacts saved".
    await queryClient.invalidateQueries({ queryKey: ["referral-strategy", jobId] });
    await queryClient.invalidateQueries({ queryKey: ["contacts"] });

    if (found.length === 0) {
      setProblem(
        "No addresses found for this employer. You can still add one by hand from the Contacts page."
      );
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => void find()}>
        <Users className="size-3.5" strokeWidth={1.75} />
        Find people here
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>People at {company}</DialogTitle>
            <DialogDescription>
              Real addresses, looked up through the contact providers. Recruiters
              are marked — they can be written to directly, since screening is
              the job.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              Looking up {company}…
            </p>
          )}

          {problem && <p className="py-4 text-sm text-muted-foreground">{problem}</p>}

          {contacts && contacts.length > 0 && (
            <ul className="divide-y divide-border">
              {contacts.map((c) => (
                <li key={c.email ?? c.name} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      {c.isRecruiter && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                          Recruiter
                        </span>
                      )}
                      {c.emailVerified && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-success">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.email}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {c.email && (
                      <>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`mailto:${c.email}`}>
                            <Mail className="size-3.5" strokeWidth={1.75} />
                            Email
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Copy ${c.name}'s address`}
                          onClick={() => {
                            navigator.clipboard?.writeText(c.email ?? "");
                            toast.success("Address copied");
                          }}
                        >
                          <Copy className="size-3.5" strokeWidth={1.75} />
                        </Button>
                      </>
                    )}
                    {/* A search, not an integration. LinkedIn prohibits
                        automated access, so the last step stays manual. */}
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
                          `${c.name ?? ""} ${company}`
                        )}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <ExternalLink className="size-3.5" strokeWidth={1.75} />
                        Find on LinkedIn
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            Nothing is sent from here. LinkedIn opens a search because their terms
            prohibit automated access — CareerOS finds the person, you make the
            approach.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
