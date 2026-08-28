import type { QueryResult } from "@/lib/api/technical-learning";

export function ResultGrid({ result }: { result: QueryResult | null }) {
  if (!result) return <p className="p-4 text-sm text-muted-foreground">Run the query to inspect its result before checking it.</p>;
  if (!result.ok) return <p role="alert" className="p-4 text-sm text-warning">{result.message ?? "The query did not run."}</p>;
  return (
    <div className="overflow-x-auto" tabIndex={0} aria-label={`Query result, ${result.rowCount} rows`}>
      <table className="w-full min-w-max border-collapse font-mono text-xs">
        <thead><tr>{result.columns.map((column) => <th key={column} scope="col" className="border-b border-r border-border bg-muted/50 px-3 py-2 text-left font-medium last:border-r-0">{column}</th>)}</tr></thead>
        <tbody>{result.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex} className="border-b border-r border-border px-3 py-2 last:border-r-0">{value === null ? <span className="text-muted-foreground">NULL</span> : String(value)}</td>)}</tr>)}</tbody>
      </table>
      {result.truncated && <p className="border-t border-border px-3 py-2 text-xs text-warning">Output capped for safety. A truncated result cannot pass a complete-result drill.</p>}
    </div>
  );
}
