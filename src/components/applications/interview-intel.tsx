"use client";

import { ExternalLink, BookOpenCheck, CalendarClock } from "lucide-react";
import type { InterviewIntel as Intel } from "@/lib/api/ops";

/**
 * What people report about this employer's actual interview process.
 *
 * The pack used to say plainly that it contained no company research, because
 * there was no source and inventing company facts before an interview is worse
 * than omitting them. That reasoning was right; what changed is having real
 * sources, gathered deliberately and stored with their URLs.
 *
 * So the sources are not a footnote here — they are the reason this section is
 * allowed to exist. A candidate needs to weigh a company's own handbook
 * differently from an SEO guide, and can only do that if both are named.
 *
 * When nothing has been researched it says so. A plausible list of questions
 * nobody verified would be the worst possible thing on this screen, because it
 * gets relied on in a room.
 */
export function InterviewIntel({ intel }: { intel: Intel }) {
  if (!intel.researched) {
    return (
      <div className="rounded-md border border-dashed border-border p-3">
        <p className="text-sm text-muted-foreground">{intel.note}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Researched {intel.ageDays === 0 ? "today" : `${intel.ageDays}d ago`}
        </span>
        {intel.stale && (
          <span className="rounded bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-warning">
            May be out of date
          </span>
        )}
        {intel.exactFamily === false && (
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Nearest role family — {intel.roleFamily}
          </span>
        )}
      </div>

      {intel.timeline && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarClock className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          {intel.timeline}
        </p>
      )}

      {intel.rounds && intel.rounds.length > 0 && (
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Rounds reported
          </h4>
          <ol className="mt-1.5 space-y-1.5">
            {intel.rounds.map((r, i) => (
              <li key={r.name} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm">
                  <span className="font-medium text-foreground">{r.name}</span>
                  <span className="text-muted-foreground"> — {r.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {intel.questionTypes && intel.questionTypes.length > 0 && (
        <Block title="What gets asked" items={intel.questionTypes} />
      )}
      {intel.prepare && intel.prepare.length > 0 && (
        <Block title="Worth preparing" items={intel.prepare} />
      )}
      {intel.reportedPitfalls && intel.reportedPitfalls.length > 0 && (
        <Block title="What candidates report" items={intel.reportedPitfalls} />
      )}

      {/* Not a footnote. This section is only allowed to exist because these
          exist, and the candidate has to be able to weigh them. */}
      {intel.sources && intel.sources.length > 0 && (
        <div className="border-t border-border pt-2.5">
          <h4 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <BookOpenCheck className="size-3" strokeWidth={1.75} />
            Sources
          </h4>
          <ul className="mt-1.5 space-y-1">
            {intel.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-start gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink className="mt-0.5 size-3 shrink-0" strokeWidth={1.75} />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h4>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
            <span className="text-muted-foreground">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
