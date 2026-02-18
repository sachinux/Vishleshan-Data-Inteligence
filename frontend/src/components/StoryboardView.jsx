import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import axios from "axios";
import {
  Plus,
  Loader2,
  GripVertical,
  Edit2,
  FileText,
  Presentation,
  AlertCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Circle,
  Target,
  Users,
  Briefcase,
  BarChart3,
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  CheckSquare,
  Trash2,
  X,
  Clock,
  PlayCircle,
  CheckCircle,
  FileEdit,
  ChevronDown,
  ChevronUp,
  FolderOpen,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Priority badge colors
const priorityColors = {
  HIGH: "bg-red-500/10 text-red-600 border-red-200",
  MEDIUM: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  LOW: "bg-green-500/10 text-green-600 border-green-200",
};

// KPI status colors
const statusColors = {
  green: "text-green-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
};

// Trend icons
const TrendIcon = ({ trend }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

// Stakeholder icons
const stakeholderIcons = {
  executive: Briefcase,
  manager: Users,
  analyst: BarChart3,
};

// Get report status based on action completion
const getReportStatus = (storyboard) => {
  const actions = storyboard?.action_items || [];
  if (actions.length === 0) return "draft";
  const completed = actions.filter(a => a.completed).length;
  if (completed === actions.length) return "completed";
  if (completed > 0) return "in-progress";
  return "draft";
};

// Format relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Report Card Component
const ReportCard = ({ report, isSelected, onClick, onDelete, onDragStart, onDragOver, onDragEnd }) => {
  const actions = report.action_items || [];
  const completed = actions.filter(a => a.completed).length;
  const total = actions.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const status = getReportStatus(report);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, report)}
      onDragOver={(e) => onDragOver(e, report)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(report)}
      className={`group p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40"
      }`}
      data-testid={`report-card-${report.id}`}
    >
      {/* Title & Delete */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium truncate flex-1">{report.title}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(report);
          }}
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckSquare className="h-3 w-3" />
            {completed}/{total}
          </span>
          <span className="flex items-center gap-1">
            <Presentation className="h-3 w-3" />
            {report.frames?.length || 0}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {getRelativeTime(report.updated_at || report.created_at)}
        </span>
      </div>
    </div>
  );
};

// Kanban Column Component
const KanbanColumn = ({ title, icon: Icon, reports, selectedReport, onSelect, onDelete, onDragStart, onDragOver, onDragEnd, onDrop, status, color }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-muted/50");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("bg-muted/50");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-muted/50");
    onDrop(status);
  };

  return (
    <div 
      className="flex-1 min-w-0 flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {reports.length}
        </Badge>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 border border-t-0 border-border rounded-b-lg bg-muted/20">
        <div className="p-2 space-y-2 min-h-[120px]">
          {reports.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No reports
            </div>
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReport?.id === report.id}
                onClick={onSelect}
                onDelete={onDelete}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const StoryboardView = ({
  workspace,
  storyTiles,
  storyboards,
  generateStoryboard,
  updateStoryboard,
  exportStoryboard,
  deleteStoryboard,
  deleteStoryTile,
  loading,
  workspaces,
  onCreateWorkspace,
  onSelectWorkspace,
}) => {
  const [openTabs, setOpenTabs] = useState([]); // Array of open report IDs
  const [activeTabId, setActiveTabId] = useState(null);
  const [editingFrame, setEditingFrame] = useState(null);
  const [showNewStoryboard, setShowNewStoryboard] = useState(false);
  const [newTitle, setNewTitle] = useState("Data Actions");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [activeContentTab, setActiveContentTab] = useState("story");
  const [stakeholderView, setStakeholderView] = useState("executive");
  const [deletingStoryboard, setDeletingStoryboard] = useState(null);
  const [draggedReport, setDraggedReport] = useState(null);
  const [isKanbanCollapsed, setIsKanbanCollapsed] = useState(false);
  const [showWorkspaceSelect, setShowWorkspaceSelect] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const handleCreateWorkspace = async () => {
    setCreatingWorkspace(true);
    try {
      await onCreateWorkspace();
      toast.success("Workspace created!");
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  // Get the currently active report
  const activeReport = storyboards.find(sb => sb.id === activeTabId);

  // Categorize reports by status
  const draftReports = storyboards.filter(sb => getReportStatus(sb) === "draft");
  const inProgressReports = storyboards.filter(sb => getReportStatus(sb) === "in-progress");
  const completedReports = storyboards.filter(sb => getReportStatus(sb) === "completed");

  // Open a report in a new tab
  const openReport = (report) => {
    if (!openTabs.includes(report.id)) {
      setOpenTabs([...openTabs, report.id]);
    }
    setActiveTabId(report.id);
  };

  // Close a tab
  const closeTab = (reportId, e) => {
    e?.stopPropagation();
    const newTabs = openTabs.filter(id => id !== reportId);
    setOpenTabs(newTabs);
    if (activeTabId === reportId) {
      setActiveTabId(newTabs[newTabs.length - 1] || null);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!newTitle.trim()) return;

    setGenerating(true);
    try {
      const newStoryboard = await generateStoryboard(newTitle);
      openReport(newStoryboard);
      setShowNewStoryboard(false);
      setNewTitle("Data Actions");
      toast.success("Data Actions generated!");
    } catch (error) {
      toast.error("Failed to generate. Make sure you have pinned insights.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteStoryboard = async () => {
    if (!deletingStoryboard) return;

    try {
      await deleteStoryboard(deletingStoryboard.id);
      closeTab(deletingStoryboard.id);
      toast.success("Report deleted");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeletingStoryboard(null);
    }
  };

  const handleExport = async (format) => {
    if (!activeReport) return;

    setExporting(format);
    try {
      await exportStoryboard(activeReport.id, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handleToggleActionItem = async (actionId, completed) => {
    if (!activeReport) return;

    try {
      await axios.put(`${API}/storyboards/${activeReport.id}/action-items`, {
        action_id: actionId,
        completed: completed,
      });
      toast.success(completed ? "Action completed!" : "Action reopened");
    } catch (error) {
      toast.error("Failed to update action item");
    }
  };

  const handleFrameEdit = async (frameId, updates) => {
    if (!activeReport) return;

    const updatedFrames = activeReport.frames.map((frame) =>
      frame.id === frameId ? { ...frame, ...updates } : frame
    );

    try {
      await updateStoryboard(activeReport.id, { frames: updatedFrames });
      setEditingFrame(null);
      toast.success("Frame updated");
    } catch (error) {
      toast.error("Failed to update frame");
    }
  };

  // Drag handlers for Kanban
  const handleDragStart = (e, report) => {
    setDraggedReport(report);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, report) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedReport(null);
  };

  const handleDrop = async (newStatus) => {
    if (!draggedReport) return;

    // Update action items to reflect new status
    const actions = draggedReport.action_items || [];
    let updatedActions = [...actions];

    if (newStatus === "completed" && actions.length > 0) {
      // Mark all as completed
      updatedActions = actions.map(a => ({ ...a, completed: true }));
    } else if (newStatus === "draft") {
      // Mark all as incomplete
      updatedActions = actions.map(a => ({ ...a, completed: false }));
    }

    if (updatedActions !== actions) {
      try {
        await updateStoryboard(draggedReport.id, { action_items: updatedActions });
        toast.success(`Report moved to ${newStatus.replace("-", " ")}`);
      } catch (error) {
        toast.error("Failed to update report status");
      }
    }

    setDraggedReport(null);
  };

  const handleDragOverFrame = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || !activeReport) return;

    const frames = [...activeReport.frames];
    const [removed] = frames.splice(draggedIndex, 1);
    frames.splice(index, 0, removed);

    const reorderedFrames = frames.map((frame, idx) => ({
      ...frame,
      order: idx,
    }));

    // Update locally for smooth UX
    setDraggedIndex(index);
  };

  const handleDragEndFrame = async () => {
    if (draggedIndex === null || !activeReport) return;

    try {
      await updateStoryboard(activeReport.id, {
        frames: activeReport.frames,
      });
    } catch (error) {
      console.error("Failed to save frame order");
    }
    setDraggedIndex(null);
  };

  const getTileById = (tileId) => {
    return storyTiles.find((tile) => tile.id === tileId);
  };

  const completedActions = activeReport?.action_items?.filter(a => a.completed)?.length || 0;
  const totalActions = activeReport?.action_items?.length || 0;

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <Presentation className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold mb-4 tracking-tight">
            No Workspace Selected
          </h1>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
            Data Actions allow you to automate workflows based on insights. 
            Select a workspace to create rules, triggers, and automated reports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button 
              size="lg"
              className="gap-2 px-6 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleCreateWorkspace}
              disabled={creatingWorkspace}
              data-testid="empty-create-workspace-actions"
            >
              {creatingWorkspace ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Create Workspace
            </Button>
            <Popover open={showWorkspaceSelect} onOpenChange={setShowWorkspaceSelect}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  size="lg"
                  className="gap-2 px-6"
                  data-testid="empty-select-workspace-actions"
                >
                  <FolderOpen className="h-5 w-5" />
                  Select Workspace
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="center">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium">Select Workspace</p>
                </div>
                <div className="max-h-[200px] overflow-auto">
                  {workspaces && workspaces.length > 0 ? (
                    workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          onSelectWorkspace(ws);
                          setShowWorkspaceSelect(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Target className="h-4 w-4 text-muted-foreground" />
                        {ws.name}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No workspaces yet
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl border border-border max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              You'll need at least one pinned insight to create a data action.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="storyboard-view">
      {/* Top Section - Kanban Board (Collapsible) */}
      <div className={`flex-shrink-0 border-b border-border bg-muted/30 transition-all duration-300 ${isKanbanCollapsed ? 'py-2 px-4' : 'p-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsKanbanCollapsed(!isKanbanCollapsed)}
            className="flex items-center gap-2 hover:text-primary transition-colors"
            data-testid="toggle-kanban-btn"
          >
            {isKanbanCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            <h2 className="font-semibold text-sm uppercase tracking-wider">
              Data Action Reports
            </h2>
            {isKanbanCollapsed && (
              <div className="flex items-center gap-2 ml-2">
                <Badge variant="secondary" className="text-[10px]">
                  {draftReports.length} Draft
                </Badge>
                <Badge variant="secondary" className="text-[10px] bg-blue-100 dark:bg-blue-900/30">
                  {inProgressReports.length} In Progress
                </Badge>
                <Badge variant="secondary" className="text-[10px] bg-green-100 dark:bg-green-900/30">
                  {completedReports.length} Completed
                </Badge>
              </div>
            )}
          </button>
          <Button
            onClick={() => setShowNewStoryboard(true)}
            disabled={storyTiles.length === 0}
            size="sm"
            className="text-xs"
            data-testid="generate-storyboard-btn"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Report
          </Button>
        </div>

        {/* Kanban Columns - Collapsible */}
        {!isKanbanCollapsed && (
          <div className="flex gap-3 h-[180px] mt-4">
            <KanbanColumn
              title="Draft"
              icon={FileEdit}
              status="draft"
              color="bg-slate-100 dark:bg-slate-800"
              reports={draftReports}
              selectedReport={activeReport}
              onSelect={openReport}
              onDelete={setDeletingStoryboard}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
            <KanbanColumn
              title="In Progress"
              icon={PlayCircle}
              status="in-progress"
              color="bg-blue-100 dark:bg-blue-900/30"
              reports={inProgressReports}
              selectedReport={activeReport}
              onSelect={openReport}
              onDelete={setDeletingStoryboard}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
            <KanbanColumn
              title="Completed"
              icon={CheckCircle}
              status="completed"
              color="bg-green-100 dark:bg-green-900/30"
              reports={completedReports}
              selectedReport={activeReport}
              onSelect={openReport}
              onDelete={setDeletingStoryboard}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          </div>
        )}

        {!isKanbanCollapsed && storyTiles.length === 0 && storyboards.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Pin insights from chat to create reports
          </p>
        )}
      </div>

      {/* Bottom Section - Report Tabs & Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Report Tabs */}
        {openTabs.length > 0 && (
          <div className="flex-shrink-0 border-b border-border bg-card">
            <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto">
              {openTabs.map((tabId) => {
                const report = storyboards.find(sb => sb.id === tabId);
                if (!report) return null;
                const isActive = activeTabId === tabId;
                return (
                  <div
                    key={tabId}
                    onClick={() => setActiveTabId(tabId)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-md cursor-pointer transition-colors text-xs ${
                      isActive
                        ? "bg-background border border-b-0 border-border"
                        : "bg-muted/50 hover:bg-muted border border-transparent"
                    }`}
                    data-testid={`report-tab-${tabId}`}
                  >
                    <span className={`truncate max-w-[120px] ${isActive ? "font-medium" : ""}`}>
                      {report.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => closeTab(tabId, e)}
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Report Content */}
        {activeReport ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Report Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">{activeReport.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeReport.frames?.length || 0} frames • {completedActions}/{totalActions} actions
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pdf")}
                  disabled={exporting === "pdf"}
                  className="text-xs"
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pptx")}
                  disabled={exporting === "pptx"}
                  className="text-xs"
                >
                  {exporting === "pptx" ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Presentation className="h-3 w-3 mr-1" />
                  )}
                  PPTX
                </Button>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs value={activeContentTab} onValueChange={setActiveContentTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-2 w-fit flex-shrink-0">
                <TabsTrigger value="story" className="text-xs">
                  <Presentation className="h-3 w-3 mr-1" />
                  Story
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Actions ({totalActions})
                </TabsTrigger>
                <TabsTrigger value="kpis" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  KPIs
                </TabsTrigger>
                <TabsTrigger value="stakeholders" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Views
                </TabsTrigger>
              </TabsList>

              {/* Story Tab */}
              <TabsContent value="story" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Executive Summary */}
                    {activeReport.executive_summary && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{activeReport.executive_summary}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Frames */}
                    {activeReport.frames?.map((frame, index) => (
                      <div
                        key={frame.id}
                        draggable
                        onDragStart={() => setDraggedIndex(index)}
                        onDragOver={(e) => handleDragOverFrame(e, index)}
                        onDragEnd={handleDragEndFrame}
                        className={`p-5 border border-border rounded-xl bg-card hover:border-primary/30 transition-all ${
                          draggedIndex === index ? "opacity-50 scale-[0.98]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2 text-muted-foreground cursor-grab pt-1">
                            <GripVertical className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base uppercase tracking-wide mb-2">
                              {frame.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              {frame.summary}
                            </p>

                            {frame.kpis?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {frame.kpis.map((kpi, i) => (
                                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                                    <span className={`text-xs font-medium ${statusColors[kpi.status] || ''}`}>
                                      {kpi.label}: {kpi.value}
                                    </span>
                                    <TrendIcon trend={kpi.trend} />
                                  </div>
                                ))}
                              </div>
                            )}

                            {frame.action_items?.length > 0 && (
                              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                  Action Items
                                </p>
                                <div className="space-y-2">
                                  {frame.action_items.map((action, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <ArrowRight className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-xs">{action.text}</span>
                                      <Badge variant="outline" className={`text-[8px] ${priorityColors[action.priority]}`}>
                                        {action.priority}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {frame.narrative_notes && (
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                  Speaker Notes
                                </p>
                                <p className="text-sm italic text-muted-foreground">
                                  {frame.narrative_notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFrame(frame)}
                            className="shrink-0 h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Action Progress</CardTitle>
                        <CardDescription className="text-xs">
                          {completedActions} of {totalActions} actions completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={totalActions > 0 ? (completedActions / totalActions) * 100 : 0} className="h-2" />
                      </CardContent>
                    </Card>

                    {['HIGH', 'MEDIUM', 'LOW'].map((priority) => {
                      const priorityActions = activeReport.action_items?.filter(a => a.priority === priority) || [];
                      if (priorityActions.length === 0) return null;

                      return (
                        <div key={priority}>
                          <div className="flex items-center gap-2 mb-3">
                            {priority === 'HIGH' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {priority === 'MEDIUM' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                            {priority === 'LOW' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            <h4 className="text-sm font-semibold uppercase">{priority} Priority</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {priorityActions.filter(a => a.completed).length}/{priorityActions.length}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {priorityActions.map((action) => (
                              <div
                                key={action.id}
                                className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
                                  action.completed ? 'bg-muted/50 border-muted' : 'bg-card border-border hover:border-primary/30'
                                }`}
                              >
                                <Checkbox
                                  checked={action.completed}
                                  onCheckedChange={(checked) => handleToggleActionItem(action.id, checked)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {action.text}
                                  </p>
                                  {action.category && (
                                    <Badge variant="secondary" className="text-[10px] mt-1">
                                      {action.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {(!activeReport.action_items || activeReport.action_items.length === 0) && (
                      <div className="text-center py-8">
                        <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">No action items yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* KPIs Tab */}
              <TabsContent value="kpis" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {activeReport.kpis?.map((kpi, i) => (
                        <Card key={i} className="relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${
                            kpi.status === 'green' ? 'bg-green-500' :
                            kpi.status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <CardHeader className="pb-2 pl-4">
                            <CardDescription className="text-xs uppercase tracking-wider">
                              {kpi.label}
                            </CardDescription>
                            <CardTitle className={`text-2xl font-bold ${statusColors[kpi.status]}`}>
                              {kpi.value}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pl-4">
                            <div className="flex items-center gap-2">
                              <TrendIcon trend={kpi.trend} />
                              <span className="text-xs text-muted-foreground">
                                {kpi.description || (kpi.trend === 'up' ? 'Increasing' : kpi.trend === 'down' ? 'Decreasing' : 'Stable')}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {(!activeReport.kpis || activeReport.kpis.length === 0) && (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">No KPIs defined</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Stakeholder Views Tab */}
              <TabsContent value="stakeholders" className="flex-1 overflow-hidden m-0">
                <div className="p-4 h-full flex flex-col">
                  <div className="flex gap-2 mb-4 flex-shrink-0">
                    {['executive', 'manager', 'analyst'].map((view) => {
                      const Icon = stakeholderIcons[view];
                      return (
                        <Button
                          key={view}
                          variant={stakeholderView === view ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStakeholderView(view)}
                          className="text-xs capitalize"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {view}
                        </Button>
                      );
                    })}
                  </div>

                  <ScrollArea className="flex-1">
                    {activeReport.stakeholder_views?.[stakeholderView] ? (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm capitalize flex items-center gap-2">
                              {(() => {
                                const Icon = stakeholderIcons[stakeholderView];
                                return <Icon className="h-4 w-4" />;
                              })()}
                              {stakeholderView} Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              {activeReport.stakeholder_views[stakeholderView].summary}
                            </p>
                          </CardContent>
                        </Card>

                        {activeReport.stakeholder_views[stakeholderView].key_points?.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Key Points</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {activeReport.stakeholder_views[stakeholderView].key_points.map((point, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {activeReport.stakeholder_views[stakeholderView].recommended_actions?.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Recommended Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {activeReport.stakeholder_views[stakeholderView].recommended_actions.map((action, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">No stakeholder views defined</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Presentation className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-3 tracking-tight">
                Select a Report
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Click on a report card in the Kanban board above to view its details, or create a new report.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Report Dialog */}
      <Dialog open={showNewStoryboard} onOpenChange={setShowNewStoryboard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Auto-generated from insights..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                data-testid="storyboard-title-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to auto-generate a title from your insights
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              AI will organize your {storyTiles.length} pinned insights into:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Executive summary</li>
              <li>• KPI dashboard</li>
              <li>• Prioritized action items</li>
              <li>• Stakeholder-specific views</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStoryboard(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateStoryboard}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Frame Dialog */}
      <Dialog open={!!editingFrame} onOpenChange={() => setEditingFrame(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Frame</DialogTitle>
          </DialogHeader>
          {editingFrame && (
            <EditFrameForm
              frame={editingFrame}
              onSave={handleFrameEdit}
              onCancel={() => setEditingFrame(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingStoryboard} onOpenChange={() => setDeletingStoryboard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingStoryboard?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStoryboard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EditFrameForm = ({ frame, onSave, onCancel }) => {
  const [title, setTitle] = useState(frame.title);
  const [summary, setSummary] = useState(frame.summary);
  const [narrativeNotes, setNarrativeNotes] = useState(frame.narrative_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(frame.id, {
      title,
      summary,
      narrative_notes: narrativeNotes,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4 py-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Summary</label>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Speaker Notes</label>
        <Textarea
          value={narrativeNotes}
          onChange={(e) => setNarrativeNotes(e.target.value)}
          rows={4}
          placeholder="Notes for presenting this frame..."
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
};
