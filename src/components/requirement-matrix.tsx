import { Check, CircleDot, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Requirement } from "@/types/job";

const matchConfig = {
  exact: { icon: Check, label: "Exact", className: "text-primary" },
  partial: { icon: CircleDot, label: "Partial", className: "text-[oklch(0.5_0.12_70)] dark:text-[oklch(0.8_0.12_80)]" },
  gap: { icon: X, label: "Gap", className: "text-destructive" },
};

export function RequirementMatrix({ requirements }: { requirements: Requirement[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Requirement</TableHead>
          <TableHead>Importance</TableHead>
          <TableHead>Evidence</TableHead>
          <TableHead className="text-right">Match</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requirements.map((req) => {
          const cfg = matchConfig[req.match];
          return (
            <TableRow key={req.id}>
              <TableCell className="font-medium text-foreground">{req.label}</TableCell>
              <TableCell>
                <Badge variant={req.importance === "required" ? "default" : "secondary"} className="font-normal">
                  {req.importance === "required" ? "Required" : "Preferred"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs text-xs text-muted-foreground">
                {req.evidence ?? "No verified evidence"}
                {req.source && (
                  <span className="ml-1 text-muted-foreground/60">— {req.source}</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.className}`}>
                  <cfg.icon className="size-3.5" strokeWidth={2} />
                  {cfg.label}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
