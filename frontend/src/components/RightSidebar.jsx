import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "lucide-react";

export const RightSidebar = ({
  workspace,
  storyTiles,
  storyboards,
  chatMessages,
  generateStoryboard,
  exportStoryboard,
  API,
  loading,
}) => {
  const [narrativeInput, setNarrativeInput] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeResponse, setNarrativeResponse] = useState("");
  const [generating, setGenerating] = useState(false);

  const latestStoryboard = storyboards?.[storyboards.length - 1];

  const handleNarrativeCoach = async () => {
    if (!narrativeInput.trim() || !workspace) return;

    setNarrativeLoading(true);
    try {
      const response = await axios.post(`${API}/chat`, {
        workspace_id: workspace.id,
        message: `As a narrative coach, help me with: ${narrativeInput}. Focus on storytelling structure, presentation flow, and key points to emphasize.`,
      });
      setNarrativeResponse(response.data.content);
      setNarrativeInput("");
    } catch (error) {
      toast.error("Failed to get narrative advice");
    } finally {
      setNarrativeLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (storyTiles.length === 0) {
      toast.error("Pin some insights first to generate a storyboard");
      return;
    }

    setGenerating(true);
    try {
      await generateStoryboard("Data Story");
      toast.success("Storyboard generated!");
    } catch (error) {
      toast.error("Failed to generate storyboard");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!latestStoryboard) {
      toast.error("Generate a storyboard first");
      return;
    }

    try {
      await exportStoryboard(latestStoryboard.id, "pdf");
      toast.success("PDF exported!");
    } catch (error) {
      toast.error("Failed to export PDF");
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
              <span className="font-semibold text-sm">Storyboard</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={!latestStoryboard}
              className="h-7 text-xs rounded-lg"
              data-testid="export-pdf-sidebar"
            >
              <FileDown className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Insights Section */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-b border-border">
          <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
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
                    className="h-6 w-6 p-0 rounded-lg"
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
                  <p className="text-xs">Generate storyboard</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {storyTiles.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl bg-secondary/30">
                <Pin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Pin insights from chat to build your story
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {storyTiles.map((tile) => (
                  <div
                    key={tile.id}
                    className="p-3 border border-border rounded-xl bg-card hover:border-primary/30 transition-all"
                    data-testid={`insight-tile-${tile.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {tile.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          {tile.explanation}
                        </p>
                      </div>
                      {tile.chart_config && (
                        <BarChart3 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {tile.key_metrics?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tile.key_metrics.slice(0, 2).map((metric, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 rounded-md"
                          >
                            {metric.length > 18 ? `${metric.slice(0, 18)}...` : metric}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Narrative Coach Section */}
        <div className="flex-shrink-0 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium text-xs">Narrative Coach</span>
          </div>

          {/* Response Area */}
          {narrativeResponse ? (
            <div className="mb-3 p-3 bg-secondary/50 rounded-xl text-xs max-h-24 overflow-y-auto">
              {narrativeResponse}
            </div>
          ) : (
            <div className="mb-3 p-4 text-center border border-dashed border-border rounded-xl bg-secondary/30">
              <p className="text-[10px] text-muted-foreground">
                Get AI help to structure your presentation
              </p>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={narrativeInput}
              onChange={(e) => setNarrativeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNarrativeCoach()}
              placeholder="Ask for story advice..."
              disabled={narrativeLoading || !workspace}
              className="text-xs h-8 rounded-lg"
              data-testid="narrative-coach-input"
            />
            <Button
              size="sm"
              onClick={handleNarrativeCoach}
              disabled={narrativeLoading || !narrativeInput.trim() || !workspace}
              className="h-8 w-8 p-0 rounded-lg"
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
      </aside>
    </TooltipProvider>
  );
};
