import { Check, CircleDot, X } from "lucide-react";
import type { Requirement } from "@/types/job";

const matchConfig = {
  exact: { icon: Check, className: "text-primary" },
  partial: { icon: CircleDot, className: "text-[oklch(0.5_0.12_70)] dark:text-[oklch(0.8_0.12_80)]" },
  gap: { icon: X, className: "text-destructive" },
};

export function RequirementsSidebar({ requirements }: { requirements: Requirement[] }) {
  const required = requirements.filter((r) => r.importance === "required");
  const preferred = requirements.filter((r) => r.importance === "preferred");

  return (
    <div className="h-full rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium text-foreground">Job Requirements</h2>

      {required.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Required
          </h3>
          <ul className="space-y-1.5">
            {required.map((req) => (
              <RequirementRow key={req.id} requirement={req} />
            ))}
          </ul>
        </div>
      )}

      {preferred.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preferred
          </h3>
          <ul className="space-y-1.5">
            {preferred.map((req) => (
              <RequirementRow key={req.id} requirement={req} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RequirementRow({ requirement }: { requirement: Requirement }) {
  const cfg = matchConfig[requirement.match];
  return (
    <li className="flex items-start gap-2 text-sm">
      <cfg.icon className={`mt-0.5 size-3.5 shrink-0 ${cfg.className}`} strokeWidth={2} />
      <span className="text-foreground/80">{requirement.label}</span>
    </li>
  );
}
