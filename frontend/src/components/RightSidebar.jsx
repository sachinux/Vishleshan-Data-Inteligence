import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Sparkles,
  Pin,
  Send,
  Loader2,
  BarChart3,
  Presentation,
  Plus,
  FileDown,
  Trash2,
  X,
} from "lucide-react";

export const RightSidebar = ({
  workspace,
  storyTiles,
  storyboards,
  chatMessages,
  generateStoryboard,
  exportStoryboard,
  deleteStoryTile,
  API,
  loading,
}) => {
  const [narrativeInput, setNarrativeInput] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeResponse, setNarrativeResponse] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deletingTile, setDeletingTile] = useState(null);

  const latestStoryboard = storyboards?.[storyboards.length - 1];

  const handleNarrativeCoach = async () => {
    if (!narrativeInput.trim() || !workspace) return;

    setNarrativeLoading(true);
    try {
      const response = await axios.post(`${API}/chat`, {
        workspace_id: workspace.id,
        message: `As a narrative coach, help me with: ${narrativeInput}. Focus on storytelling structure and key points.`,
      });
      setNarrativeResponse(response.data.content);
      setNarrativeInput("");
    } catch (error) {
      toast.error("Failed to get advice");
    } finally {
      setNarrativeLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (storyTiles.length === 0) {
      toast.error("Pin some insights first");
      return;
    }

    setGenerating(true);
    try {
      await generateStoryboard("Data Actions");
      toast.success("Data Actions generated!");
    } catch (error) {
      toast.error("Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!latestStoryboard) {
      toast.error("Generate Data Actions first");
      return;
    }

    try {
      await exportStoryboard(latestStoryboard.id, "pdf");
      toast.success("PDF exported!");
    } catch (error) {
      toast.error("Failed to export");
    }
  };

  const handleDeleteTile = async () => {
    if (!deletingTile) return;

    try {
      await deleteStoryTile(deletingTile.id);
      toast.success("Insight removed");
    } catch (error) {
      toast.error("Failed to delete insight");
    } finally {
      setDeletingTile(null);
    }
  };

  return (
    <TooltipProvider>
      <aside className="right-sidebar" data-testid="right-sidebar">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              <span className="font-medium text-sm">Data Actions</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!latestStoryboard}
              className="h-7 text-xs"
              data-testid="export-pdf-sidebar"
            >
              <FileDown className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Pinned Insights */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-b border-border">
          <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Pinned Insights ({storyTiles.length})
            </span>
            {storyTiles.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateStoryboard}
                    disabled={generating}
                    className="h-6 w-6 p-0"
                    data-testid="generate-from-insights"
                  >
                    {generating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Create Data Actions</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {storyTiles.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed border-border rounded-lg bg-muted/30">
                <Pin className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Pin insights from chat to build your actions
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {storyTiles.map((tile) => (
                  <div
                    key={tile.id}
                    className="group p-3 border border-border rounded-lg bg-card hover:border-primary/30 transition-colors relative"
                    data-testid={`insight-tile-${tile.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{tile.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          {tile.explanation}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {tile.chart_config && (
                          <BarChart3 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTile(tile)}
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          data-testid={`delete-tile-${tile.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Narrative Coach */}
        <div className="flex-shrink-0 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium text-xs">Narrative Coach</span>
          </div>

          {narrativeResponse ? (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg text-xs max-h-24 overflow-y-auto">
              {narrativeResponse}
            </div>
          ) : (
            <div className="mb-3 p-3 text-center border border-dashed border-border rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground">
                Get AI help to structure your presentation
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={narrativeInput}
              onChange={(e) => setNarrativeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNarrativeCoach()}
              placeholder="Ask for story advice..."
              disabled={narrativeLoading || !workspace}
              className="text-xs h-8"
              data-testid="narrative-coach-input"
            />
            <Button
              size="sm"
              onClick={handleNarrativeCoach}
              disabled={narrativeLoading || !narrativeInput.trim() || !workspace}
              className="h-8 w-8 p-0"
              data-testid="narrative-coach-send"
            >
              {narrativeLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Delete Insight Confirmation Dialog */}
        <AlertDialog open={!!deletingTile} onOpenChange={() => setDeletingTile(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pinned Insight</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{deletingTile?.title}"? This will remove it from all storyboards.
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
