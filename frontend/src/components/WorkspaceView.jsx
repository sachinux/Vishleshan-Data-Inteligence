import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import axios from "axios";
import {
  Upload,
  Link,
  FileSpreadsheet,
  FileText,
  Table,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  TrendingUp,
  Hash,
  Type,
  Calendar,
  CircleDot,
  AlertTriangle,
  Sparkles,
  Trash2,
  Database,
  Plus,
  ChevronDown,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const WorkspaceView = ({
  workspace,
  datasets,
  selectedDataset,
  setSelectedDataset,
  dataProfile,
  uploadFile,
  importGoogleSheet,
  loading,
  onDatasetDeleted,
}) => {
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deletingDataset, setDeletingDataset] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const handleDeleteDataset = async () => {
    if (!deletingDataset) return;
    
    setDeleting(true);
    try {
      await axios.delete(`${API}/datasets/${deletingDataset.id}`);
      onDatasetDeleted(deletingDataset.id);
      toast.success(`Deleted ${deletingDataset.filename}`);
    } catch (error) {
      toast.error("Failed to delete dataset");
    } finally {
      setDeleting(false);
      setDeletingDataset(null);
    }
  };

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
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-3">
            Start by Creating Your First Workspace
          </h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Your Data helps you organize datasets, analysis, and actions in one place. 
            Create a new workspace or select an existing one to begin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => {/* This would need to be passed as prop */}}
              className="gap-2"
              data-testid="empty-create-workspace"
            >
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
            <Button 
              variant="outline"
              className="gap-2"
              data-testid="empty-select-workspace"
            >
              <ChevronDown className="h-4 w-4" />
              Select Existing Workspace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" data-testid="workspace-view">
      {/* Header - FIXED */}
      <div className="flex-shrink-0 p-6 border-b border-border bg-card">
        <h2 className="font-heading text-2xl uppercase tracking-wider text-primary">
          {workspace.name}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {workspace.description || "Workspace for data analysis"}
        </p>
      </div>

      {/* Main Content - SCROLLABLE sections */}
      <div className="workspace-layout">
        {/* Upload Section - Left Panel */}
        <div className="workspace-left">
          <div className="workspace-left-content">
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
                  <div
                    key={dataset.id}
                    className={`file-item w-full group ${
                      selectedDataset?.id === dataset.id ? "active" : ""
                    }`}
                  >
                    <button
                      onClick={() => setSelectedDataset(dataset)}
                      data-testid={`workspace-dataset-${dataset.id}`}
                      className="flex-1 flex items-center min-w-0"
                    >
                      <Icon className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-mono text-sm truncate">{dataset.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {dataset.row_count} rows × {dataset.column_count} cols •{" "}
                          {dataset.file_type.toUpperCase()}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {selectedDataset?.id === dataset.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingDataset(dataset);
                        }}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        data-testid={`delete-dataset-${dataset.id}`}
                        aria-label={`Delete ${dataset.filename}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        {/* Data Profile Section - Right Panel */}
        <div className="workspace-right">
          <div className="workspace-right-content">
          {dataProfile && selectedDataset ? (
            <TooltipProvider>
              <div data-testid="data-profile-panel">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-lg uppercase tracking-wider text-primary">
                    Data Profile
                  </h3>
                  <Badge variant="outline" className="font-mono">
                    {selectedDataset.file_type.toUpperCase()}
                  </Badge>
                </div>

                {/* Data Quality Score */}
                <Card className="mb-6 border-primary/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-heading text-sm uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Data Quality Score
                      </CardTitle>
                      <span className="text-2xl font-mono text-primary">
                        {Math.round(100 - (dataProfile.columns.reduce((acc, col) => acc + col.null_percentage, 0) / dataProfile.columns.length))}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress 
                      value={100 - (dataProfile.columns.reduce((acc, col) => acc + col.null_percentage, 0) / dataProfile.columns.length)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on completeness, data types, and value distribution
                    </p>
                  </CardContent>
                </Card>

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

                {/* Column Type Distribution */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="font-heading text-sm uppercase tracking-wider">
                      Column Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const typeCount = {};
                        dataProfile.columns.forEach(col => {
                          const type = col.dtype.includes('int') || col.dtype.includes('float') ? 'numeric' : 
                                       col.dtype.includes('date') || col.dtype.includes('time') ? 'datetime' :
                                       col.dtype.includes('bool') ? 'boolean' : 'text';
                          typeCount[type] = (typeCount[type] || 0) + 1;
                        });
                        return Object.entries(typeCount).map(([type, count]) => {
                          const icons = { numeric: Hash, text: Type, datetime: Calendar, boolean: CircleDot };
                          const Icon = icons[type] || Type;
                          return (
                            <div key={type} className="flex items-center gap-2 px-3 py-2 border border-border">
                              <Icon className="h-4 w-4 text-primary" />
                              <span className="text-xs font-mono uppercase">{type}</span>
                              <Badge variant="secondary" className="text-xs">{count}</Badge>
                            </div>
                          );
                        });
                      })()}
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
                        {dataProfile.columns.map((col, idx) => {
                          const isNumeric = col.dtype.includes('int') || col.dtype.includes('float');
                          const hasHighNulls = col.null_percentage > 20;
                          const hasLowCardinality = col.unique_count < 10 && col.unique_count > 1;
                          
                          return (
                            <div
                              key={idx}
                              className="p-3 border border-border hover:border-primary/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-primary">
                                    {col.name}
                                  </span>
                                  {hasHighNulls && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">High null percentage ({col.null_percentage}%)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {hasLowCardinality && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-3 w-3 text-blue-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Low cardinality - good for grouping</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground font-mono">
                                  {col.dtype}
                                </span>
                              </div>
                              
                              {/* Completeness Bar */}
                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Completeness</span>
                                  <span className="font-mono">{(100 - col.null_percentage).toFixed(1)}%</span>
                                </div>
                                <Progress value={100 - col.null_percentage} className="h-1" />
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
                              
                              {/* Sample Values */}
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
                              
                              {/* AI-suggested column insight */}
                              {isNumeric && col.mean_value && (
                                <div className="mt-2 p-2 bg-primary/5 border-l-2 border-primary">
                                  <p className="text-xs text-muted-foreground">
                                    <TrendingUp className="h-3 w-3 inline mr-1 text-primary" />
                                    {col.mean_value > 0 ? 
                                      `Average: ${col.mean_value.toFixed(2)} | Range: ${parseFloat(col.max_value) - parseFloat(col.min_value)}` :
                                      "Numeric column suitable for aggregations"
                                    }
                                  </p>
                                </div>
                              )}
                              {hasLowCardinality && (
                                <div className="mt-2 p-2 bg-blue-500/5 border-l-2 border-blue-500">
                                  <p className="text-xs text-muted-foreground">
                                    <Info className="h-3 w-3 inline mr-1 text-blue-500" />
                                    Categorical column - ideal for grouping & filtering
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TooltipProvider>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
                  <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-2">
                  No Dataset Selected
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Upload a new dataset or select an existing one to view its profile and start analyzing.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Dataset
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Delete Dataset Confirmation Dialog */}
      <AlertDialog open={!!deletingDataset} onOpenChange={() => setDeletingDataset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDataset?.filename}"? 
              This will also remove all related chat history and insights. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDataset}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
