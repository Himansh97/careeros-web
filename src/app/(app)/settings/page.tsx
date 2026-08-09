"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { UserCircle, SlidersHorizontal, Plug, ChevronRight, Circle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { isLiveApi } from "@/lib/api/client";
import { getHealth } from "@/lib/api/health";

const sections = [
  {
    href: "/settings/profile",
    icon: UserCircle,
    title: "Candidate Profile",
    description:
      "Identity, education, and the career evidence library that resume tailoring draws from.",
  },
  {
    href: "/settings/preferences",
    icon: SlidersHorizontal,
    title: "Preferences",
    description: "Target roles, locations, and standard application answers.",
  },
  {
    href: "/settings/integrations",
    icon: Plug,
    title: "Integrations",
    description: "Job sources, contact providers, and what each connection may do.",
  },
];

export default function SettingsPage() {
  const live = isLiveApi();
  const { data } = useQuery({ queryKey: ["health"], queryFn: getHealth, enabled: live });
  const healthy = data?.ok;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Settings" description="Profile, preferences, and connections." />

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <Circle
          className={`size-2.5 ${healthy ? "fill-primary text-primary" : "fill-muted-foreground/40 text-muted-foreground/40"}`}
          strokeWidth={0}
        />
        <span className="text-sm text-foreground">
          {healthy ? "Connected to the CareerOS API" : "API not reachable"}
        </span>
        {healthy && (
          <Badge variant="secondary" className="ml-auto font-normal">
            {Object.values(data.data.lastFetchCounts ?? {})
              .reduce((a, b) => a + b, 0)
              .toLocaleString()}{" "}
            jobs indexed
          </Badge>
        )}
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-4 px-4 py-3.5 hover:bg-accent/40"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <s.icon className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.description}</div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          </Link>
        ))}
      </div>
    </div>
  );
}
