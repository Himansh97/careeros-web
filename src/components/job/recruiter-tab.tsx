"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Search, ShieldCheck, ShieldAlert, KeyRound, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { lookupContactsForJob, saveContact } from "@/lib/api/contacts";

interface RecruiterTabProps {
  jobId: string;
  companyName: string;
}

export function RecruiterTab({ jobId, companyName }: RecruiterTabProps) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", title: "", email: "", linkedinUrl: "" });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["contact-lookup", jobId],
    queryFn: () => lookupContactsForJob(jobId),
    enabled: false, // lookup is explicit — it spends a Hunter credit
  });

  async function handleSave(payload: {
    name: string;
    title?: string;
    email?: string | null;
    linkedinUrl?: string | null;
    confidence?: number;
    emailVerified?: boolean;
    provider?: string;
    whySelected?: string;
  }) {
    const res = await saveContact({ ...payload, company: companyName, jobId });
    if (res.ok) {
      toast.success(`Saved ${payload.name}`);
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      setForm({ name: "", title: "", email: "", linkedinUrl: "" });
    } else {
      toast.error("Couldn't save contact");
    }
  }

  const result = data?.ok ? data.data : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
          <Search className="size-3.5" strokeWidth={1.75} />
          {isFetching ? "Looking up…" : "Look up recruiters"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <UserPlus className="size-3.5" strokeWidth={1.75} />
          Add manually
        </Button>
      </div>

      {isLoading || isFetching ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !data ? (
        <EmptyState
          icon={Search}
          title="No lookup run yet"
          description="Look up recruiters at this employer, or add someone you found yourself. Contacts are never guessed from name patterns."
        />
      ) : !result?.available ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {result?.reason === "no_api_key"
                ? "Automatic lookup needs a key"
                : result?.reason === "no_domain"
                  ? "Employer domain unavailable"
                  : "Lookup unavailable"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{result?.detail}</p>
          </div>
        </div>
      ) : result.contacts.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No contacts found"
          description={`Hunter has no indexed addresses for ${result.domain}. Try adding a contact manually.`}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{result.note}</p>
          {result.contacts.map((c) => (
            <div
              key={c.email ?? c.name}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-medium text-foreground">{c.name}</h4>
                  {c.isRecruiter && (
                    <Badge variant="secondary" className="font-normal">Recruiting</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                {c.email && (
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {c.emailVerified ? (
                      <ShieldCheck className="size-3 text-primary" strokeWidth={2} />
                    ) : (
                      <ShieldAlert className="size-3" strokeWidth={2} />
                    )}
                    {c.email}
                    <span className="text-muted-foreground/60">· {c.confidence}% confidence</span>
                  </p>
                )}
                {c.linkedinUrl && (
                  <a
                    href={c.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Link2 className="size-3" strokeWidth={1.75} />
                    LinkedIn
                  </a>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleSave({
                    name: c.name,
                    title: c.title,
                    email: c.email,
                    linkedinUrl: c.linkedinUrl,
                    confidence: c.confidence,
                    emailVerified: c.emailVerified,
                    provider: c.provider,
                    whySelected: c.isRecruiter
                      ? "Recruiting-related title at this employer"
                      : "Listed at this employer's domain",
                  })
                }
              >
                Save
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a contact at {companyName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(
              [
                ["name", "Full name"],
                ["title", "Title"],
                ["email", "Email (optional)"],
                ["linkedinUrl", "LinkedIn URL (optional)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              disabled={!form.name.trim()}
              onClick={() =>
                handleSave({
                  name: form.name.trim(),
                  title: form.title.trim() || undefined,
                  email: form.email.trim() || null,
                  linkedinUrl: form.linkedinUrl.trim() || null,
                  provider: "manual",
                  whySelected: "Added manually",
                })
              }
            >
              Save contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
