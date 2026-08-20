import type { DatasetTable } from "@/lib/api/technical-learning";

export function SchemaBrowser({ tables }: { tables: DatasetTable[] }) {
  if (tables.length === 0) return null;
  return (
    <aside aria-label="Dataset schema" className="border border-border bg-card">
      <div className="border-b border-border px-4 py-3 font-mono text-[11px] tracking-[0.15em] uppercase">
        Dataset manifest
      </div>
      <div className="divide-y divide-border">
        {tables.map((table, index) => (
          <details key={table.table} open={index === 0} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px]">
              <span className="font-mono">{table.table}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{table.rows} rows</span>
            </summary>
            <dl className="border-t border-border bg-muted/35 px-4 py-3">
              {table.columns.map((column) => (
                <div key={column.name} className="flex justify-between gap-4 py-1 font-mono text-xs">
                  <dt>{column.name}</dt><dd className="text-muted-foreground">{column.type}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </aside>
  );
}
