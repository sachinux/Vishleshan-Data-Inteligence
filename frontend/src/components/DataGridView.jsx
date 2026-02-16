import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import {
  Loader2,
  BookOpen,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";

export const DataGridView = ({
  dataset,
  workspace,
  API,
  onAnalysisComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [gridData, setGridData] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const pageSize = 50;

  // Fetch grid data
  const fetchGridData = useCallback(async () => {
    if (!dataset) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${API}/datasets/${dataset.id}/rows?page=${currentPage}&page_size=${pageSize}`
      );
      setGridData(response.data);
    } catch (error) {
      console.error("Error fetching grid data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [API, dataset, currentPage]);

  useEffect(() => {
    fetchGridData();
    setSelectedRows(new Set()); // Clear selection on page/dataset change
  }, [fetchGridData]);

  // Handle row selection
  const toggleRowSelection = (rowIndex) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  // Select all rows on current page
  const toggleSelectAll = () => {
    if (!gridData) return;

    const currentPageIndices = gridData.data.map((row) => row._row_index);
    const allSelected = currentPageIndices.every((idx) => selectedRows.has(idx));

    const newSelected = new Set(selectedRows);
    if (allSelected) {
      currentPageIndices.forEach((idx) => newSelected.delete(idx));
    } else {
      currentPageIndices.forEach((idx) => newSelected.add(idx));
    }
    setSelectedRows(newSelected);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // Analyze selected rows
  const analyzeSelectedRows = async (action) => {
    if (selectedRows.size === 0) {
      toast.error("Please select at least one row");
      return;
    }

    if (action === "compare" && selectedRows.size < 2) {
      toast.error("Please select at least 2 rows to compare");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await axios.post(`${API}/datasets/selected-rows/analyze`, {
        workspace_id: workspace.id,
        dataset_id: dataset.id,
        row_indices: Array.from(selectedRows),
        action: action,
      });

      toast.success(
        action === "narrate" 
          ? "Story generated!" 
          : "Comparison complete!"
      );

      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }
    } catch (error) {
      console.error("Error analyzing rows:", error);
      toast.error("Failed to analyze selected rows");
    } finally {
      setAnalyzing(false);
    }
  };

  // Sort data (client-side for current page)
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get sorted data
  const getSortedData = () => {
    if (!gridData || !sortColumn) return gridData?.data || [];

    return [...gridData.data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Select a dataset to view data
          </p>
        </div>
      </div>
    );
  }

  const sortedData = getSortedData();
  const currentPageIndices = gridData?.data?.map((row) => row._row_index) || [];
  const allCurrentPageSelected =
    currentPageIndices.length > 0 &&
    currentPageIndices.every((idx) => selectedRows.has(idx));

  return (
    <div className="flex flex-col h-full" data-testid="data-grid-view">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-3 border-b border-border bg-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {selectedRows.size} selected
          </Badge>
          {selectedRows.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs h-7"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeSelectedRows("narrate")}
            disabled={analyzing || selectedRows.size === 0}
            className="text-xs"
            data-testid="narrate-story-btn"
          >
            {analyzing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <BookOpen className="h-3 w-3 mr-2" />
            )}
            Narrate Story
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeSelectedRows("compare")}
            disabled={analyzing || selectedRows.size < 2}
            className="text-xs"
            data-testid="compare-data-btn"
          >
            {analyzing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <GitCompare className="h-3 w-3 mr-2" />
            )}
            Compare Data
          </Button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : gridData ? (
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allCurrentPageSelected}
                      onCheckedChange={toggleSelectAll}
                      data-testid="select-all-checkbox"
                    />
                  </TableHead>
                  <TableHead className="w-12 text-xs">#</TableHead>
                  {gridData.columns.map((col) => (
                    <TableHead
                      key={col}
                      className="text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[120px]">{col}</span>
                        {sortColumn === col && (
                          <span className="text-primary">
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row, idx) => {
                  const rowIndex = row._row_index;
                  const isSelected = selectedRows.has(rowIndex);

                  return (
                    <TableRow
                      key={rowIndex}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleRowSelection(rowIndex)}
                      data-testid={`row-${rowIndex}`}
                    >
                      <TableCell className="w-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRowSelection(rowIndex)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="w-12 text-xs text-muted-foreground font-mono">
                        {rowIndex + 1}
                      </TableCell>
                      {gridData.columns.map((col) => (
                        <TableCell
                          key={col}
                          className="text-xs font-mono max-w-[150px] truncate"
                        >
                          {row[col] !== null && row[col] !== undefined
                            ? String(row[col])
                            : "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {gridData && (
        <div className="flex-shrink-0 p-3 border-t border-border bg-card flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, gridData.total_rows)} of{" "}
            {gridData.total_rows} rows
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronsLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <span className="text-xs px-3">
              Page {currentPage} of {gridData.total_pages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === gridData.total_pages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(gridData.total_pages)}
              disabled={currentPage === gridData.total_pages}
              className="h-7 w-7 p-0"
            >
              <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
