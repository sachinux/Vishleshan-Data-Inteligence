import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Presentation className="h-3 w-3 text-primary" />
              <span className="font-heading text-xs uppercase tracking-wider">
                Storyboard
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPDF}
              disabled={!latestStoryboard}
              className="text-[10px] font-mono text-primary hover:text-primary h-6 px-2"
              data-testid="export-pdf-sidebar"
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Insights Section - Scrollable */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-b border-border">
          <div className="flex-shrink-0 p-3 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Insights ({storyTiles.length})
            </span>
            {storyTiles.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateStoryboard}
                    disabled={generating}
                    className="h-5 w-5 p-0"
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
                  <p className="text-xs">Generate storyboard from insights</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {storyTiles.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded">
                <Pin className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">
                  Pin insights from your chat here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {storyTiles.map((tile) => (
                  <div
                    key={tile.id}
                    className="p-2 border border-border hover:border-primary/50 transition-colors bg-card/50"
                    data-testid={`insight-tile-${tile.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-primary truncate">
                          {tile.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          {tile.explanation}
                        </p>
                      </div>
                      {tile.chart_config && (
                        <BarChart3 className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {tile.key_metrics?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {tile.key_metrics.slice(0, 2).map((metric, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[8px] px-1 py-0 h-4"
                          >
                            {metric.length > 15 ? `${metric.slice(0, 15)}...` : metric}
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

        {/* Narrative Coach Section - Fixed at bottom */}
        <div className="flex-shrink-0 p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Narrative Coach
            </span>
          </div>

          {/* Response Area */}
          {narrativeResponse ? (
            <div className="mb-2 p-2 bg-primary/5 border-l-2 border-primary text-[10px] max-h-20 overflow-y-auto">
              {narrativeResponse}
            </div>
          ) : (
            <div className="mb-2 text-center py-3">
              <p className="text-[10px] text-muted-foreground">
                Ask for help organizing your presentation flow
              </p>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={narrativeInput}
              onChange={(e) => setNarrativeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNarrativeCoach()}
              placeholder="Ask about your story..."
              disabled={narrativeLoading || !workspace}
              className="text-[10px] h-7"
              data-testid="narrative-coach-input"
            />
            <Button
              size="sm"
              onClick={handleNarrativeCoach}
              disabled={narrativeLoading || !narrativeInput.trim() || !workspace}
              className="h-7 w-7 p-0"
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
