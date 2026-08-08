import { pipelineColumns, type ApplicationRecord } from "@/types/application";
import { ApplicationCard } from "@/components/applications/application-card";

export function BoardView({ applications }: { applications: ApplicationRecord[] }) {
  return (
    <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
      {pipelineColumns.map((col) => {
        const items = applications.filter((a) => a.status === col.value);
        return (
          <div key={col.value} className="flex w-64 shrink-0 flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {col.label}
              </h3>
              <span className="text-xs text-muted-foreground/70">{items.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-lg bg-muted/30 p-2">
              {items.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground/60">
                  Empty
                </div>
              ) : (
                items.map((app) => <ApplicationCard key={app.id} application={app} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
