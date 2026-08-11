"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAlerts } from "@/lib/api/ops";
import { isLiveApi } from "@/lib/api/client";

/**
 * Things written, approved or received — and then never acted on.
 *
 * Every other view in the app is keyed on what happened: applications sent,
 * outreach delivered, follow-ups due. Nothing surfaced the opposite, which is
 * what actually costs opportunities — six outreach drafts unsent for days, a
 * recruiter reply approved and forgotten, a SoFi application stopped on a
 * security-code step that nothing noticed.
 *
 * Deliberately quiet when there is nothing wrong: a banner that is always
 * present is one nobody reads.
 */
export function AlertsBanner() {
  const [expanded, setExpanded] = React.useState(false);

  const { data } = useQuery({
    queryKey: ["alerts"],
    queryFn: listAlerts,
    enabled: isLiveApi(),
  });

  const alerts = data?.ok ? data.data.alerts : [];
  if (alerts.length === 0) return null;

  const high = alerts.filter((a) => a.severity === "high");
  const shown = expanded ? alerts : alerts.slice(0, 3);
  const urgent = high.length > 0;

  return (
    <div
      className={`rounded-lg border p-3 ${
        urgent ? "border-warning/40 bg-warning/10" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {urgent ? (
          <AlertTriangle className="size-4 shrink-0 text-warning" strokeWidth={1.75} />
        ) : (
          <Inbox className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        )}
        <span className="text-sm font-medium text-foreground">
          {alerts.length} thing{alerts.length === 1 ? "" : "s"} waiting on you
        </span>
        {urgent && (
          <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
            {high.length} urgent
          </span>
        )}
        {alerts.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : `Show all ${alerts.length}`}
            <ChevronDown
              className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              strokeWidth={1.75}
            />
          </Button>
        )}
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {shown.map((alert, i) => (
          <li key={`${alert.kind}-${alert.ref ?? i}`} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                alert.severity === "high" ? "bg-warning" : "bg-muted-foreground/50"
              }`}
            />
            <div className="min-w-0">
              <p className="text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground">
                {alert.detail} <span className="font-medium">{alert.action}.</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
