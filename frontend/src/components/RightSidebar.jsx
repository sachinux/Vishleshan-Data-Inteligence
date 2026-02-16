import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CheckSquare,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
  Pin,
  Sparkles,
  BarChart3,
  Trash2,
  X,
  ListChecks,
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
  green: "text-green-600 bg-green-500/10",
  yellow: "text-yellow-600 bg-yellow-500/10",
  red: "text-red-600 bg-red-500/10",
};

// Trend icons
const TrendIcon = ({ trend }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export const RightSidebar = ({
  workspace,
  storyTiles,
  storyboards,
  generateStoryboard,
  deleteStoryTile,
  API: apiProp,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState("insights");
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [togglingAction, setTogglingAction] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [deletingTile, setDeletingTile] = useState(null);

  // Get the latest/active storyboard
  const activeStoryboard = storyboards?.[storyboards.length - 1];
  
  // Get action items from active storyboard
  const actionItems = activeStoryboard?.action_items || [];
  const completedCount = actionItems.filter(a => a.completed).length;
  const totalCount = actionItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get KPIs from active storyboard
  const kpis = activeStoryboard?.kpis || [];

  // Get high priority items
  const highPriorityItems = actionItems.filter(a => a.priority === "HIGH" && !a.completed);
  const pendingItems = actionItems.filter(a => !a.completed).slice(0, 5);

  // Toggle tile selection
  const toggleTileSelection = (tileId) => {
    const newSelected = new Set(selectedTiles);
    if (newSelected.has(tileId)) {
      newSelected.delete(tileId);
    } else {
      newSelected.add(tileId);
    }
    setSelectedTiles(newSelected);
  };

  // Select all tiles
  const selectAllTiles = () => {
    if (selectedTiles.size === storyTiles.length) {
      setSelectedTiles(new Set());
    } else {
      setSelectedTiles(new Set(storyTiles.map(t => t.id)));
    }
  };

  // Generate data actions from selected tiles
  const handleGenerateFromSelected = async () => {
    if (selectedTiles.size === 0) {
      toast.error("Select at least one insight");
      return;
    }

    setGenerating(true);
    try {
      await generateStoryboard("Data Actions");
      toast.success("Data Actions generated!");
      setSelectedTiles(new Set());
      setActiveTab("actions");
    } catch (error) {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  // Delete tile
  const handleDeleteTile = async () => {
    if (!deletingTile) return;

    try {
      await deleteStoryTile(deletingTile.id);
      selectedTiles.delete(deletingTile.id);
      setSelectedTiles(new Set(selectedTiles));
      toast.success("Insight removed");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeletingTile(null);
    }
  };

  // Toggle action item
  const handleToggleAction = async (actionId, completed) => {
    if (!activeStoryboard) return;

    setTogglingAction(actionId);
    try {
      await axios.put(`${API}/storyboards/${activeStoryboard.id}/action-items`, {
        action_id: actionId,
        completed: completed,
      });
      toast.success(completed ? "Action completed!" : "Action reopened");
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setTogglingAction(null);
    }
  };

  return (
    <TooltipProvider>
      <aside className="right-sidebar flex flex-col" data-testid="right-sidebar">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 px-3 pt-3">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="insights" className="text-xs">
                <Pin className="h-3 w-3 mr-1" />
                Insights ({storyTiles.length})
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Actions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 flex flex-col overflow-hidden m-0 p-0 data-[state=inactive]:hidden">
            {/* Selection Toolbar */}
            {storyTiles.length > 0 && (
              <div className="flex-shrink-0 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTiles.size === storyTiles.length && storyTiles.length > 0}
                    onCheckedChange={selectAllTiles}
                    data-testid="select-all-tiles"
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedTiles.size > 0 ? `${selectedTiles.size} selected` : "Select all"}
                  </span>
                </div>
                {selectedTiles.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleGenerateFromSelected}
                    disabled={generating}
                    className="h-7 text-xs"
                    data-testid="generate-from-selected"
                  >
                    {generating ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    Create Actions
                  </Button>
                )}
              </div>
            )}

            {/* Insights List */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {storyTiles.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-border rounded-lg bg-muted/30">
                    <Pin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">No Pinned Insights</p>
                    <p className="text-xs text-muted-foreground">
                      Pin insights from your analysis to build data actions
                    </p>
                  </div>
                ) : (
                  storyTiles.map((tile) => (
                    <div
                      key={tile.id}
                      className={`group p-3 border rounded-lg transition-all cursor-pointer ${
                        selectedTiles.has(tile.id)
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                      onClick={() => toggleTileSelection(tile.id)}
                      data-testid={`insight-tile-${tile.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTiles.has(tile.id)}
                          onCheckedChange={() => toggleTileSelection(tile.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          {/* Title & Impact */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium leading-tight">
                              {tile.title}
                            </p>
                            {tile.impact_score && (
                              <Badge 
                                variant="outline" 
                                className={`text-[9px] flex-shrink-0 ${priorityColors[tile.impact_score]}`}
                              >
                                {tile.impact_score}
                              </Badge>
                            )}
                          </div>

                          {/* Explanation */}
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {tile.explanation}
                          </p>

                          {/* Key Metrics */}
                          {tile.key_metrics?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tile.key_metrics.slice(0, 3).map((metric, i) => (
                                <Badge key={i} variant="secondary" className="text-[9px]">
                                  {metric}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Indicators */}
                          <div className="flex items-center gap-3">
                            {tile.action_items?.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <ListChecks className="h-3 w-3" />
                                <span>{tile.action_items.length} action{tile.action_items.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {tile.chart_config && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <BarChart3 className="h-3 w-3" />
                                <span>Chart</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTile(tile);
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          data-testid={`delete-tile-${tile.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Bottom Action Bar */}
            {storyTiles.length > 0 && (
              <div className="flex-shrink-0 p-3 border-t border-border bg-muted/30">
                <Button
                  onClick={handleGenerateFromSelected}
                  disabled={generating || selectedTiles.size === 0}
                  className="w-full text-xs"
                  data-testid="generate-all-btn"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {selectedTiles.size > 0 
                    ? `Create Actions from ${selectedTiles.size} Insight${selectedTiles.size > 1 ? 's' : ''}`
                    : "Select Insights to Create Actions"
                  }
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="flex-1 flex flex-col overflow-hidden m-0 p-0 data-[state=inactive]:hidden">
            {activeStoryboard ? (
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {/* Progress Overview */}
                  <div className="p-3 border border-border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Progress
                      </span>
                      <span className="text-xs font-medium">
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-[10px] text-muted-foreground mt-2 truncate">
                      {activeStoryboard.title}
                    </p>
                  </div>

                  {/* KPI Summary */}
                  {kpis.length > 0 && (
                    <div className="p-3 border border-border rounded-lg bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Key Metrics
                        </span>
                      </div>
                      <div className="space-y-1">
                        {kpis.slice(0, 4).map((kpi, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded-lg ${statusColors[kpi.status] || 'bg-muted/50'}`}
                          >
                            <span className="text-[9px] font-medium truncate flex-1 mr-2">
                              {kpi.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold">{kpi.value}</span>
                              <TrendIcon trend={kpi.trend} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Urgent Actions */}
                  {highPriorityItems.length > 0 && (
                    <div className="p-3 border border-red-200 rounded-lg bg-red-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-[10px] text-red-600 uppercase tracking-wider font-medium">
                          Urgent ({highPriorityItems.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {highPriorityItems.slice(0, 3).map((action) => (
                          <div
                            key={action.id}
                            className="flex items-start gap-2 p-2 bg-white/50 border border-red-100 rounded-lg"
                          >
                            <Checkbox
                              checked={action.completed}
                              onCheckedChange={(checked) => handleToggleAction(action.id, checked)}
                              disabled={togglingAction === action.id}
                              className="mt-0.5 border-red-300"
                            />
                            <p className="text-[9px] leading-tight flex-1 line-clamp-2">
                              {action.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* To Do List */}
                  <div className="p-3 border border-border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          To Do
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[8px]">
                        {actionItems.filter(a => !a.completed).length} left
                      </Badge>
                    </div>
                    
                    {pendingItems.length === 0 ? (
                      <div className="text-center py-4 px-3 border border-dashed border-border rounded-lg bg-muted/30">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                        <p className="text-[10px] text-muted-foreground">
                          All done!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {pendingItems.map((action) => (
                          <div
                            key={action.id}
                            className="flex items-start gap-2 p-2 border border-border rounded-lg bg-background hover:border-primary/30 transition-colors"
                          >
                            <Checkbox
                              checked={action.completed}
                              onCheckedChange={(checked) => handleToggleAction(action.id, checked)}
                              disabled={togglingAction === action.id}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] leading-tight line-clamp-2">
                                {action.text}
                              </p>
                              {action.category && (
                                <Badge variant="secondary" className="text-[7px] mt-1">
                                  {action.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 border border-border rounded-lg bg-card text-center">
                      <p className="text-lg font-bold text-green-600">{completedCount}</p>
                      <p className="text-[8px] text-muted-foreground">Done</p>
                    </div>
                    <div className="p-2 border border-border rounded-lg bg-card text-center">
                      <p className="text-lg font-bold text-yellow-600">
                        {actionItems.filter(a => a.priority === "MEDIUM" && !a.completed).length}
                      </p>
                      <p className="text-[8px] text-muted-foreground">Pending</p>
                    </div>
                    <div className="p-2 border border-border rounded-lg bg-card text-center">
                      <p className="text-lg font-bold text-red-600">{highPriorityItems.length}</p>
                      <p className="text-[8px] text-muted-foreground">Urgent</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">No Data Actions</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Create Data Actions from your insights
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("insights")}
                    className="text-xs"
                  >
                    <Pin className="h-3 w-3 mr-1" />
                    View Insights
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingTile} onOpenChange={() => setDeletingTile(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pinned Insight</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{deletingTile?.title}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTile}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </aside>
    </TooltipProvider>
  );
};
