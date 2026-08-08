"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Briefcase,
  FileCheck2,
  Send,
  MessageSquareReply,
  CalendarCheck2,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";

const metrics = [
  { label: "New jobs", value: 0, icon: Search },
  { label: "Strong matches", value: 0, icon: Sparkles },
  { label: "Applications ready", value: 0, icon: FileCheck2 },
  { label: "Submitted this week", value: 0, icon: Send },
  { label: "Recruiter replies", value: 0, icon: MessageSquareReply },
  { label: "Interviews", value: 0, icon: CalendarCheck2 },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Good morning, Himanshu"
        description="No searches have been run yet — connect job discovery to start finding opportunities."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/jobs")}>
              Search Jobs
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info(
                  "Autopilot isn't connected yet — it'll run discovery, scoring, and tailoring automatically once wired up."
                )
              }
            >
              <Bot className="size-3.5" strokeWidth={1.75} />
              Run Autopilot
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={m.value} icon={m.icon} />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="relative inline-flex size-2 rounded-full bg-muted-foreground/50" />
            </span>
            <span className="text-sm font-medium text-foreground">Autopilot</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Idle
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/automations")}>
            Configure
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <h2 className="mb-3 text-sm font-medium text-foreground">Top Opportunities</h2>
        <EmptyState
          icon={Briefcase}
          title="No matches yet"
          description="CareerOS hasn't found a role above your fit threshold. Run a search to start discovering opportunities."
          action={
            <Button size="sm" onClick={() => router.push("/jobs")}>
              Discover Jobs
            </Button>
          }
        />
      </div>
    </div>
  );
}
