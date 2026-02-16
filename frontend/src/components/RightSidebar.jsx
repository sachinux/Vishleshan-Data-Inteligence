import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import axios from "axios";
import {
  CheckSquare,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Zap,
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
  API: apiProp,
  loading,
}) => {
  const [togglingAction, setTogglingAction] = useState(null);

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

  const handleToggleAction = async (actionId, completed) => {
    if (!activeStoryboard) return;

    setTogglingAction(actionId);
    try {
      await axios.put(`${API}/storyboards/${activeStoryboard.id}/action-items`, {
        action_id: actionId,
        completed: completed,
      });
      toast.success(completed ? "Action completed!" : "Action reopened");
      // Parent will refresh via state update
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setTogglingAction(null);
    }
  };

  return (
    <TooltipProvider>
      <aside className="right-sidebar" data-testid="right-sidebar">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Quick Actions</span>
          </div>
        </div>

        {activeStoryboard ? (
          <>
            {/* Progress Overview */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Progress
                </span>
                <span className="text-xs font-medium">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-2">
                {activeStoryboard.title}
              </p>
            </div>

            {/* KPI Summary */}
            {kpis.length > 0 && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Key Metrics
                  </span>
                </div>
                <div className="space-y-2">
                  {kpis.slice(0, 4).map((kpi, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-2 rounded-lg ${statusColors[kpi.status] || 'bg-muted/50'}`}
                    >
                      <span className="text-[10px] font-medium truncate flex-1 mr-2">
                        {kpi.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold">{kpi.value}</span>
                        <TrendIcon trend={kpi.trend} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High Priority Actions */}
            {highPriorityItems.length > 0 && (
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600 uppercase tracking-wider font-medium">
                    Urgent ({highPriorityItems.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {highPriorityItems.slice(0, 3).map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-2 p-2 bg-red-500/5 border border-red-200 rounded-lg"
                    >
                      <Checkbox
                        checked={action.completed}
                        onCheckedChange={(checked) => handleToggleAction(action.id, checked)}
                        disabled={togglingAction === action.id}
                        className="mt-0.5 border-red-300"
                      />
                      <p className="text-[10px] leading-tight flex-1">
                        {action.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Actions */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    To Do
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px]">
                  {actionItems.filter(a => !a.completed).length} left
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3">
                {pendingItems.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed border-border rounded-lg bg-muted/30">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      All actions completed!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingItems.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-2 p-2 border border-border rounded-lg bg-card hover:border-primary/30 transition-colors"
                      >
                        <Checkbox
                          checked={action.completed}
                          onCheckedChange={(checked) => handleToggleAction(action.id, checked)}
                          disabled={togglingAction === action.id}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] leading-tight">
                            {action.text}
                          </p>
                          {action.category && (
                            <Badge variant="secondary" className="text-[8px] mt-1">
                              {action.category}
                            </Badge>
                          )}
                        </div>
                        {togglingAction === action.id && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="flex-shrink-0 p-3 border-t border-border bg-muted/30">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{completedCount}</p>
                  <p className="text-[9px] text-muted-foreground">Done</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">
                    {actionItems.filter(a => a.priority === "MEDIUM" && !a.completed).length}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{highPriorityItems.length}</p>
                  <p className="text-[9px] text-muted-foreground">Urgent</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">No Data Actions</p>
              <p className="text-xs text-muted-foreground">
                Generate Data Actions to see your action items here
              </p>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
};
