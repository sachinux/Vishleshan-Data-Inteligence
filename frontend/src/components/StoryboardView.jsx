import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
}) => {
  const [selectedStoryboard, setSelectedStoryboard] = useState(null);
  const [editingFrame, setEditingFrame] = useState(null);
  const [showNewStoryboard, setShowNewStoryboard] = useState(false);
  const [newTitle, setNewTitle] = useState("Data Actions");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("story");
  const [stakeholderView, setStakeholderView] = useState("executive");
  const [deletingStoryboard, setDeletingStoryboard] = useState(null);
  const [deletingTile, setDeletingTile] = useState(null);

  useEffect(() => {
    if (storyboards.length > 0 && !selectedStoryboard) {
      setSelectedStoryboard(storyboards[0]);
    }
  }, [storyboards, selectedStoryboard]);

  // Sync selected storyboard with updates
  useEffect(() => {
    if (selectedStoryboard) {
      const updated = storyboards.find(sb => sb.id === selectedStoryboard.id);
      if (updated) {
        setSelectedStoryboard(updated);
      }
    }
  }, [storyboards, selectedStoryboard?.id]);

  const handleGenerateStoryboard = async () => {
    if (!newTitle.trim()) return;

    setGenerating(true);
    try {
      const newStoryboard = await generateStoryboard(newTitle);
      setSelectedStoryboard(newStoryboard);
      setShowNewStoryboard(false);
      setNewTitle("Data Story");
      toast.success("Storyboard generated with action items!");
    } catch (error) {
      toast.error("Failed to generate storyboard. Make sure you have story tiles.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format) => {
    if (!selectedStoryboard) return;

    setExporting(format);
    try {
      await exportStoryboard(selectedStoryboard.id, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handleToggleActionItem = async (actionId, completed) => {
    if (!selectedStoryboard) return;

    try {
      await axios.put(`${API}/storyboards/${selectedStoryboard.id}/action-items`, {
        action_id: actionId,
        completed: completed,
      });

      // Update local state
      const updatedActionItems = selectedStoryboard.action_items.map(item =>
        item.id === actionId ? { ...item, completed } : item
      );

      setSelectedStoryboard({
        ...selectedStoryboard,
        action_items: updatedActionItems,
      });

      toast.success(completed ? "Action completed!" : "Action reopened");
    } catch (error) {
      toast.error("Failed to update action item");
    }
  };

  const handleFrameEdit = async (frameId, updates) => {
    if (!selectedStoryboard) return;

    const updatedFrames = selectedStoryboard.frames.map((frame) =>
      frame.id === frameId ? { ...frame, ...updates } : frame
    );

    try {
      const updated = await updateStoryboard(selectedStoryboard.id, {
        frames: updatedFrames,
      });
      setSelectedStoryboard(updated);
      setEditingFrame(null);
      toast.success("Frame updated");
    } catch (error) {
      toast.error("Failed to update frame");
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const frames = [...selectedStoryboard.frames];
    const [removed] = frames.splice(draggedIndex, 1);
    frames.splice(index, 0, removed);

    const reorderedFrames = frames.map((frame, idx) => ({
      ...frame,
      order: idx,
    }));

    setSelectedStoryboard({
      ...selectedStoryboard,
      frames: reorderedFrames,
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !selectedStoryboard) return;

    try {
      await updateStoryboard(selectedStoryboard.id, {
        frames: selectedStoryboard.frames,
      });
    } catch (error) {
      console.error("Failed to save frame order");
    }
    setDraggedIndex(null);
  };

  const getTileById = (tileId) => {
    return storyTiles.find((tile) => tile.id === tileId);
  };

  const completedActions = selectedStoryboard?.action_items?.filter(a => a.completed)?.length || 0;
  const totalActions = selectedStoryboard?.action_items?.length || 0;

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground text-sm">
            Select a workspace to view storyboards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="storyboard-layout" data-testid="storyboard-view">
      {/* Left Panel - Storyboard List */}
      <div className="storyboard-sidebar">
        <div className="storyboard-sidebar-header">
          <h2 className="font-semibold text-sm uppercase tracking-wider mb-4">
            Storyboards
          </h2>
          <Button
            onClick={() => setShowNewStoryboard(true)}
            disabled={storyTiles.length === 0}
            className="w-full text-xs"
            data-testid="generate-storyboard-btn"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Storyboard
          </Button>
          {storyTiles.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Pin insights from chat first
            </p>
          )}
        </div>

        <div className="storyboard-sidebar-content">
          <div className="p-4 space-y-2">
            {storyboards.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No storyboards yet
              </p>
            ) : (
              storyboards.map((sb) => (
                <button
                  key={sb.id}
                  onClick={() => setSelectedStoryboard(sb)}
                  data-testid={`storyboard-item-${sb.id}`}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedStoryboard?.id === sb.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium truncate">{sb.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sb.frames?.length || 0} frames • {sb.action_items?.length || 0} actions
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Story Tiles */}
          {storyTiles.length > 0 && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Story Tiles: {storyTiles.length}
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {storyTiles.map((tile) => (
                  <div
                    key={tile.id}
                    className="p-2 border border-border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs truncate flex-1">{tile.title}</p>
                      {tile.impact_score && (
                        <Badge variant="outline" className={`text-[9px] ml-1 ${priorityColors[tile.impact_score]}`}>
                          {tile.impact_score}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Storyboard Editor */}
      <div className="storyboard-main">
        {selectedStoryboard ? (
          <>
            {/* Header */}
            <div className="storyboard-main-header flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg uppercase tracking-wider">
                  {selectedStoryboard.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedStoryboard.frames?.length || 0} frames • {completedActions}/{totalActions} actions completed
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pdf")}
                  disabled={exporting === "pdf"}
                  className="text-xs"
                  data-testid="export-pdf-btn"
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <FileText className="h-4 w-4 mr-1" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pptx")}
                  disabled={exporting === "pptx"}
                  className="text-xs"
                  data-testid="export-pptx-btn"
                >
                  {exporting === "pptx" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Presentation className="h-4 w-4 mr-1" />
                  )}
                  PPTX
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-4 mt-2 w-fit">
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
                    {selectedStoryboard.executive_summary && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{selectedStoryboard.executive_summary}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Frames */}
                    {selectedStoryboard.frames?.map((frame, index) => (
                      <div
                        key={frame.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        data-testid={`frame-${frame.id}`}
                        className={`storyboard-frame p-5 border border-border rounded-xl bg-card hover:border-primary/30 transition-all ${
                          draggedIndex === index ? "opacity-50 scale-[0.98]" : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Drag Handle & Number */}
                          <div className="flex items-center gap-2 text-muted-foreground cursor-grab pt-1">
                            <GripVertical className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base uppercase tracking-wide mb-2">
                              {frame.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              {frame.summary}
                            </p>

                            {/* Frame KPIs */}
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

                            {/* Frame Action Items */}
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

                            {/* Included Tiles */}
                            {frame.tile_refs?.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                  Included Tiles
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {frame.tile_refs.map((tileId) => {
                                    const tile = getTileById(tileId);
                                    return tile ? (
                                      <span
                                        key={tileId}
                                        className="px-2 py-1 text-xs bg-secondary rounded-md"
                                      >
                                        {tile.title}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Speaker Notes */}
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

                          {/* Edit Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFrame(frame)}
                            className="shrink-0 h-8 w-8 p-0"
                            data-testid={`edit-frame-${frame.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Actions Tab - Checklist Mode */}
              <TabsContent value="actions" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Progress */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Action Progress</CardTitle>
                        <CardDescription className="text-xs">
                          {completedActions} of {totalActions} actions completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: totalActions > 0 ? `${(completedActions / totalActions) * 100}%` : '0%' }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Priority Groups */}
                    {['HIGH', 'MEDIUM', 'LOW'].map((priority) => {
                      const priorityActions = selectedStoryboard.action_items?.filter(a => a.priority === priority) || [];
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
                                  data-testid={`action-checkbox-${action.id}`}
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

                    {(!selectedStoryboard.action_items || selectedStoryboard.action_items.length === 0) && (
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
                      {selectedStoryboard.kpis?.map((kpi, i) => (
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

                    {(!selectedStoryboard.kpis || selectedStoryboard.kpis.length === 0) && (
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
                  {/* View Selector */}
                  <div className="flex gap-2 mb-4">
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

                  {/* View Content */}
                  <ScrollArea className="flex-1">
                    {selectedStoryboard.stakeholder_views?.[stakeholderView] ? (
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
                              {selectedStoryboard.stakeholder_views[stakeholderView].summary}
                            </p>
                          </CardContent>
                        </Card>

                        {selectedStoryboard.stakeholder_views[stakeholderView].key_points?.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Key Points</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {selectedStoryboard.stakeholder_views[stakeholderView].key_points.map((point, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {selectedStoryboard.stakeholder_views[stakeholderView].recommended_actions?.length > 0 && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Recommended Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {selectedStoryboard.stakeholder_views[stakeholderView].recommended_actions.map((action, i) => (
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Create Your Story</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a storyboard from your pinned insights to create an actionable presentation
              </p>
              <Button
                onClick={() => setShowNewStoryboard(true)}
                disabled={storyTiles.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Storyboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Storyboard Dialog */}
      <Dialog open={showNewStoryboard} onOpenChange={setShowNewStoryboard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Actionable Storyboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter storyboard title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              data-testid="storyboard-title-input"
            />
            <p className="text-xs text-muted-foreground">
              AI will organize your {storyTiles.length} pinned insights into a narrative with:
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
              disabled={generating || !newTitle.trim()}
              data-testid="confirm-generate-btn"
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
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="edit-frame-title"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Summary</label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          data-testid="edit-frame-summary"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Speaker Notes</label>
        <Textarea
          value={narrativeNotes}
          onChange={(e) => setNarrativeNotes(e.target.value)}
          rows={4}
          placeholder="Notes for presenting this frame..."
          data-testid="edit-frame-notes"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} data-testid="save-frame-btn">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
};
