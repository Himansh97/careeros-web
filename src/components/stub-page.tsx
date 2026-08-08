import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

interface StubPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  action?: React.ReactNode;
}

/**
 * Shared shell for routes whose real functionality isn't wired up yet.
 * Honest by design — no fabricated data, no "Coming Soon" copy, just an
 * accurate description of what's missing (usually: a backend to call).
 */
export function StubPage({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
  action,
}: StubPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
        action={action}
        className="flex-1"
      />
    </div>
  );
}
