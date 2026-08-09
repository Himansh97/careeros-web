"use client";

import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultRules, type AutomationRules } from "@/types/automation";

const numericRules: { key: keyof AutomationRules; label: string; hint?: string }[] = [
  { key: "minimumFitToTailor", label: "Minimum fit to tailor" },
  { key: "minimumResumeScore", label: "Minimum resume score", hint: "Internal quality threshold" },
  { key: "maxApplicationsPerDay", label: "Max applications / day", hint: "A ceiling, not a target" },
  { key: "jobRecencyDays", label: "Job recency (days)" },
  { key: "autoRejectBelowFit", label: "Auto-reject below fit" },
  { key: "recruiterConfidenceMinimum", label: "Recruiter confidence minimum" },
  { key: "followUpDelayBusinessDays", label: "Follow-up delay (business days)" },
];

export function AutomationRulesPanel() {
  const [rules, setRules] = React.useState<AutomationRules>(defaultRules);

  function updateNumeric(key: keyof AutomationRules, value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    setRules((prev) => ({ ...prev, [key]: parsed }));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">Automation rules</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        These take effect once automation is connected — changing them here updates the local
        config only.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {numericRules.map((rule) => (
          <label key={rule.key} className="space-y-1">
            <span className="text-xs text-muted-foreground">{rule.label}</span>
            <Input
              type="number"
              value={rules[rule.key] as number}
              onChange={(e) => updateNumeric(rule.key, e.target.value)}
              className="h-8"
            />
            {rule.hint && (
              <span className="text-[11px] text-muted-foreground/70">{rule.hint}</span>
            )}
          </label>
        ))}

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Submission mode</span>
          <Select
            value={rules.submissionMode}
            onValueChange={(v) => {
              setRules((prev) => ({ ...prev, submissionMode: v as AutomationRules["submissionMode"] }));
              if (v === "auto") {
                toast.warning("Auto-submit selected", {
                  description:
                    "Applications would be submitted without your review. This is off by default for a reason — it can't be undone once sent.",
                });
              }
            }}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approval">Approval required</SelectItem>
              <SelectItem value="auto">Auto-submit</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Email mode</span>
          <Select
            value={rules.emailMode}
            onValueChange={(v) =>
              setRules((prev) => ({ ...prev, emailMode: v as AutomationRules["emailMode"] }))
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft only</SelectItem>
              <SelectItem value="approval">Approval required</SelectItem>
              <SelectItem value="auto_verified">Auto (verified contacts only)</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  );
}
