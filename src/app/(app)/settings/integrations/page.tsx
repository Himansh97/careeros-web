import { Mail, Calendar, Globe, Link2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    name: "Email",
    icon: Mail,
    status: "Not connected" as const,
    detail: "Drafts get created for review — sending is never automatic, even once connected.",
  },
  {
    name: "Calendar",
    icon: Calendar,
    status: "Not connected" as const,
    detail: "Used to schedule follow-ups and interview reminders once connected.",
  },
  {
    name: "ATS Browser",
    icon: Globe,
    status: "Not connected" as const,
    detail: "Fills application forms on supported ATS platforms — submission always requires your approval.",
  },
  {
    name: "LinkedIn",
    icon: Link2,
    status: "Manual outreach only" as const,
    detail: "No automation exists or is planned — messages are drafted for you to send yourself.",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Integrations"
        description="What CareerOS can connect to, and exactly what each connection is (and isn't) allowed to do."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center gap-4 px-4 py-3.5"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <integration.icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {integration.name}
                </span>
                <Badge variant="secondary" className="font-normal text-muted-foreground">
                  {integration.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{integration.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
