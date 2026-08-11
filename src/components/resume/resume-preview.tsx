"use client";

import * as React from "react";
import { FileText, Download, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { API_URL, isLiveApi } from "@/lib/api/client";

interface ResumePreviewProps {
  jobId: string;
  company: string;
  role: string;
}

/**
 * The whole resume, as the employer will receive it.
 *
 * The workspace shows bullets as editable rows, which is right for tailoring
 * but never shows the document: page breaks, how full page two is, whether the
 * summary and projects fit. Those are exactly what `documents.build_pdf`
 * enforces (2 pages, last page at least 45% full) and what the candidate could
 * only check by downloading the file and opening it.
 *
 * This renders the same bytes the download and the employer get — the API's
 * `resume.pdf`, not a re-implementation of it in HTML. A preview that could
 * disagree with the artifact would be worse than none.
 */
export function ResumePreview({ jobId, company, role }: ResumePreviewProps) {
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  const live = isLiveApi();
  const src = `${API_URL}/api/jobs/${encodeURIComponent(jobId)}/resume.pdf`;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="size-3.5" strokeWidth={1.75} />
        Preview
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Drop the iframe on close so reopening re-renders from the API and
          // reflects any edits made in between.
          if (!next) setReady(false);
        }}
      >
        <DialogContent className="flex h-[92vh] max-w-5xl flex-col gap-3 p-4 sm:p-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base">
              {role} — {company}
            </DialogTitle>
            <DialogDescription>
              The exact PDF that downloads and that an employer receives.
            </DialogDescription>
          </DialogHeader>

          {!live ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-8 text-center">
              <AlertCircle className="size-5 text-muted-foreground" strokeWidth={1.75} />
              <p className="text-sm font-medium text-foreground">
                The CareerOS API isn&apos;t reachable
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                The PDF is rendered by the backend, so there is nothing to show
                until it&apos;s running on port 8000.
              </p>
            </div>
          ) : (
            <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-muted/30">
              {!ready && (
                <div className="absolute inset-0 space-y-3 p-6">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              )}
              <iframe
                src={src}
                title={`Tailored resume for ${role} at ${company}`}
                className="size-full"
                onLoad={() => setReady(true)}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Two pages maximum, single column, ATS-safe — enforced when the PDF
              is built.
            </p>
            <div className="flex gap-2">
              {live && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={src} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" strokeWidth={1.75} />
                    Open in new tab
                  </a>
                </Button>
              )}
              <Button size="sm" asChild disabled={!live}>
                <a href={`${src}?download=1`} download>
                  <Download className="size-3.5" strokeWidth={1.75} />
                  Download PDF
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
