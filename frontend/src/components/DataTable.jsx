import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const DataTable = ({ data }) => {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  if (!data || !data.data) {
    return null;
  }

  const tableData = Array.isArray(data.data) ? data.data : Object.entries(data.data).map(([key, value]) => ({ key, value }));
  const columns = data.columns || Object.keys(tableData[0] || {});
  
  const totalPages = Math.ceil(tableData.length / pageSize);
  const startIdx = page * pageSize;
  const endIdx = Math.min(startIdx + pageSize, tableData.length);
  const currentData = tableData.slice(startIdx, endIdx);

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    if (typeof value === "number") {
      return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    return String(value).substring(0, 100);
  };

  return (
    <div data-testid="data-table" className="border border-border">
      <ScrollArea className="w-full">
        <table className="data-table w-full">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>{formatValue(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground font-mono">
            {startIdx + 1}-{endIdx} of {tableData.length} rows
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
