"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { draftOutreach } from "@/lib/api/ops";

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
  const [showAll, setShowAll] = React.useState(false);
  const [drafting, setDrafting] = React.useState(false);

  async function draft() {
    setDrafting(true);
    const res = await draftOutreach(jobId);
    setDrafting(false);
    if (!res.ok) {
      toast.error("Couldn't draft outreach", {
        description: res.message ?? "The backend rejected it.",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["outreach"] });
    toast.success("Email and LinkedIn message drafted", {
      description: "Nothing was sent. Find both under Recruiter Outreach.",
      action: { label: "Open", onClick: () => router.push("/outreach") },
    });
  }
  const [problem, setProblem] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

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
              Ranked by how much reason each person has to reply — title against
              the role, seniority, and background you actually share. Recruiters
              can be written to directly; screening is their job.
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
              {(showAll ? contacts : contacts.filter((c) => (c.rankScore ?? 0) >= 70)).map((c) => (
                <li key={c.email ?? c.name} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.rank === 1 && (
                        <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary-foreground">
                          Best path
                        </span>
                      )}
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
                        {/* Gmail, not `mailto:`. A mailto hands off to the OS
                            default handler — Apple Mail here — so mail written
                            for the job search was being composed in an iCloud
                            account the candidate does not send from. */}
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(c.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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

          {/* A provider returns everyone it can find. Ten names is the same
              problem as none — the candidate still has to pick one. */}
          {contacts && contacts.length > 0 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full rounded-sm py-1 text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showAll
                ? "Show only the ones worth writing to"
                : `Show all ${contacts.length} found`}
            </button>
          )}

          {contacts && contacts.length > 0 && (
            <Button onClick={() => void draft()} disabled={drafting} className="w-full">
              {drafting ? "Drafting…" : "Draft email and LinkedIn message"}
            </Button>
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
