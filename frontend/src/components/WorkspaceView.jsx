import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Upload,
  Link,
  FileSpreadsheet,
  FileText,
  Table,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export const WorkspaceView = ({
  workspace,
  datasets,
  selectedDataset,
  setSelectedDataset,
  dataProfile,
  uploadFile,
  importGoogleSheet,
  loading,
}) => {
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (files) => {
    if (!workspace) {
      toast.error("Please select or create a workspace first");
      return;
    }

    for (const file of files) {
      try {
        await uploadFile(file);
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) return;
    if (!workspace) {
      toast.error("Please select or create a workspace first");
      return;
    }

    setImporting(true);
    try {
      await importGoogleSheet(googleSheetUrl);
      toast.success("Google Sheet imported successfully");
      setGoogleSheetUrl("");
    } catch (error) {
      toast.error("Failed to import Google Sheet. Make sure it's publicly accessible.");
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "csv":
      case "excel":
        return FileSpreadsheet;
      case "pdf":
        return FileText;
      case "google_sheets":
        return Table;
      default:
        return FileSpreadsheet;
    }
  };

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-xl uppercase tracking-wider mb-2">
            No Workspace Selected
          </h2>
          <p className="text-muted-foreground text-sm">
            Create or select a workspace to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="workspace-view">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="font-heading text-2xl uppercase tracking-wider text-primary">
          {workspace.name}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {workspace.description || "Workspace for data analysis"}
        </p>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Upload Section */}
        <div className="w-1/2 border-r border-border p-6 overflow-y-auto">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="upload" className="flex-1 font-mono uppercase text-xs">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="google" className="flex-1 font-mono uppercase text-xs">
                <Link className="h-4 w-4 mr-2" />
                Google Sheets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
                />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-heading text-sm uppercase tracking-wider mb-2">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports CSV, Excel (.xlsx, .xls), and PDF files
                </p>
              </div>

              {loading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs uppercase tracking-wider">Processing...</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="google">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-sm uppercase tracking-wider">
                    Import from Google Sheets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Paste Google Sheets URL..."
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="font-mono text-sm"
                    data-testid="google-sheet-url-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure the sheet is set to "Anyone with the link can view"
                  </p>
                  <Button
                    onClick={handleGoogleSheetImport}
                    disabled={importing || !googleSheetUrl.trim()}
                    className="w-full font-mono uppercase"
                    data-testid="import-google-sheet-btn"
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Link className="h-4 w-4 mr-2" />
                    )}
                    Import Sheet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dataset List */}
          <div className="mt-8">
            <h3 className="font-heading text-sm uppercase tracking-wider mb-4 text-muted-foreground">
              Datasets ({datasets.length})
            </h3>
            <div className="space-y-2">
              {datasets.map((dataset) => {
                const Icon = getFileIcon(dataset.file_type);
                return (
                  <button
                    key={dataset.id}
                    onClick={() => setSelectedDataset(dataset)}
                    data-testid={`workspace-dataset-${dataset.id}`}
                    className={`file-item w-full ${
                      selectedDataset?.id === dataset.id ? "active" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="font-mono text-sm truncate">{dataset.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {dataset.row_count} rows × {dataset.column_count} cols •{" "}
                        {dataset.file_type.toUpperCase()}
                      </p>
                    </div>
                    {selectedDataset?.id === dataset.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data Profile Section */}
        <div className="w-1/2 p-6 overflow-y-auto">
          {dataProfile && selectedDataset ? (
            <div data-testid="data-profile-panel">
              <h3 className="font-heading text-lg uppercase tracking-wider mb-4 text-primary">
                Data Profile
              </h3>

              {/* Summary Stats */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="font-heading text-sm uppercase tracking-wider">
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border border-border">
                      <p className="text-2xl font-mono text-primary">
                        {dataProfile.row_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Rows
                      </p>
                    </div>
                    <div className="text-center p-4 border border-border">
                      <p className="text-2xl font-mono text-primary">
                        {dataProfile.column_count}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Columns
                      </p>
                    </div>
                    <div className="text-center p-4 border border-border">
                      <p className="text-2xl font-mono text-primary">
                        {dataProfile.memory_usage}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Memory
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Column Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-sm uppercase tracking-wider">
                    Column Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {dataProfile.columns.map((col, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-primary">
                              {col.name}
                            </span>
                            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground font-mono">
                              {col.dtype}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Unique:</span>
                              <span className="font-mono">{col.unique_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nulls:</span>
                              <span className="font-mono">{col.null_percentage}%</span>
                            </div>
                            {col.min_value && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Min:</span>
                                <span className="font-mono truncate max-w-[80px]">
                                  {col.min_value}
                                </span>
                              </div>
                            )}
                            {col.max_value && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Max:</span>
                                <span className="font-mono truncate max-w-[80px]">
                                  {col.max_value}
                                </span>
                              </div>
                            )}
                            {col.mean_value !== null && col.mean_value !== undefined && (
                              <div className="flex justify-between col-span-2">
                                <span className="text-muted-foreground">Mean:</span>
                                <span className="font-mono">
                                  {col.mean_value.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                          {col.sample_values.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <span className="text-xs text-muted-foreground">
                                Sample:{" "}
                              </span>
                              <span className="text-xs font-mono">
                                {col.sample_values.slice(0, 3).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-heading text-sm uppercase tracking-wider mb-2">
                  No Dataset Selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload or select a dataset to view its profile
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
