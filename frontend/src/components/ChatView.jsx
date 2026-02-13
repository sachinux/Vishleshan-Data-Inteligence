import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axios from "axios";
import {
  Send,
  Loader2,
  Code,
  ChevronDown,
  ChevronUp,
  Pin,
  AlertCircle,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  HelpCircle,
  Maximize2,
  History,
  Zap,
  TrendingUp,
  Search,
  Filter,
  GitBranch,
  Brain,
  Lightbulb,
  ChevronRight,
  X,
} from "lucide-react";
import { ChartRenderer } from "@/components/ChartRenderer";
import { DataTable } from "@/components/DataTable";

// Workflow Templates - Pre-built analysis patterns
const WORKFLOW_TEMPLATES = [
  {
    id: "summary",
    name: "Data Summary",
    icon: BarChart3,
    prompt: "Give me a comprehensive summary of this dataset including key statistics, distributions, and notable patterns",
    category: "Exploratory",
  },
  {
    id: "correlation",
    name: "Correlation Analysis",
    icon: GitBranch,
    prompt: "Analyze correlations between all numeric columns and highlight the strongest relationships",
    category: "Analysis",
  },
  {
    id: "anomaly",
    name: "Anomaly Detection",
    icon: AlertCircle,
    prompt: "Identify any outliers or anomalies in the data and explain their potential significance",
    category: "Analysis",
  },
  {
    id: "trends",
    name: "Trend Analysis",
    icon: TrendingUp,
    prompt: "Identify and visualize key trends in the data over time or across categories",
    category: "Visualization",
  },
  {
    id: "distribution",
    name: "Distribution Analysis",
    icon: PieChart,
    prompt: "Show the distribution of values across key columns with appropriate visualizations",
    category: "Visualization",
  },
  {
    id: "topn",
    name: "Top N Analysis",
    icon: Zap,
    prompt: "Show me the top 10 values by the most important numeric column",
    category: "Exploratory",
  },
];

export const ChatView = ({
  workspace,
  selectedDataset,
  createStoryTile,
  API,
  chatMessages,
  setChatMessages,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [savingTile, setSavingTile] = useState(null);
  const [showQueryNav, setShowQueryNav] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [detailPanel, setDetailPanel] = useState(null);
  const [clarifying, setClarifying] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync messages with parent
  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  // Fetch chat history
  const fetchMessages = useCallback(async () => {
    if (!workspace) return;
    try {
      const response = await axios.get(`${API}/chat/${workspace.id}`);
      setMessages(response.data);
      if (setChatMessages) setChatMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [API, workspace, setChatMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (customPrompt) => {
    const messageText = customPrompt || input.trim();
    if (!messageText || !workspace) return;

    if (!customPrompt) setInput("");
    setSending(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        workspace_id: workspace.id,
        message: messageText,
        dataset_id: selectedDataset?.id,
      });

      const newMessages = [
        ...messages,
        { role: "user", content: messageText, id: Date.now().toString() },
        response.data,
      ];
      setMessages(newMessages);
      if (setChatMessages) setChatMessages(newMessages);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to process your question");
    } finally {
      setSending(false);
    }
  };

  const handleSaveAsTile = async (message) => {
    if (!message.id) return;
    
    setSavingTile(message.id);
    try {
      await createStoryTile(message.id);
      toast.success("Pinned to Insights!");
    } catch (error) {
      toast.error("Failed to pin insight");
    } finally {
      setSavingTile(null);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleWorkflowClick = (workflow) => {
    handleSend(workflow.prompt);
  };

  const handleClarify = async (message) => {
    if (!message.id) return;
    
    setClarifying(message.id);
    const clarifyPrompt = `Please explain in more detail: "${message.content?.substring(0, 100)}...". Break down the analysis step by step and explain the methodology used.`;
    
    try {
      const response = await axios.post(`${API}/chat`, {
        workspace_id: workspace.id,
        message: clarifyPrompt,
        dataset_id: selectedDataset?.id,
      });

      setMessages((prev) => [
        ...prev,
        { role: "user", content: "🔍 Clarify this analysis", id: Date.now().toString() },
        response.data,
      ]);
    } catch (error) {
      toast.error("Failed to get clarification");
    } finally {
      setClarifying(null);
    }
  };

  const handleExpandDetail = (message, type) => {
    setDetailPanel({ message, type });
  };

  // Get user queries for Query Navigator
  const userQueries = messages.filter((m) => m.role === "user");

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-xl uppercase tracking-wider mb-2">
            No Workspace Selected
          </h2>
          <p className="text-muted-foreground text-sm">
            Select a workspace to start chatting with your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="chat-area flex h-full" data-testid="chat-view">
        {/* Query Navigator Sidebar - FIXED */}
        {showQueryNav && (
          <div className="query-navigator animate-slide-in">
            <div className="query-navigator-header flex items-center justify-between">
              <span className="font-heading text-xs uppercase tracking-wider text-primary">
                Query Navigator
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQueryNav(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="query-navigator-content">
              <div className="p-2 space-y-1">
                {userQueries.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No queries yet
                  </p>
                ) : (
                  userQueries.map((query, idx) => (
                    <button
                      key={query.id || idx}
                      onClick={() => {
                        const element = document.getElementById(`msg-${query.id}`);
                        element?.scrollIntoView({ behavior: "smooth" });
                        setSelectedQuery(query.id);
                      }}
                      className={`w-full text-left p-2 text-xs font-mono border transition-colors truncate ${
                        selectedQuery === query.id
                          ? "border-primary bg-primary/10"
                          : "border-transparent hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-muted-foreground mr-2">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {query.content?.substring(0, 40)}...
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header - FIXED */}
          <div className="chat-header p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQueryNav(!showQueryNav)}
                className={showQueryNav ? "text-primary" : ""}
                data-testid="toggle-query-nav"
              >
                <History className="h-4 w-4 mr-2" />
                Queries
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h2 className="font-heading text-lg uppercase tracking-wider text-primary">
                  Chat & Analysis
                </h2>
                {selectedDataset && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Analyzing: {selectedDataset.filename}
                  </p>
                )}
              </div>
            </div>
            {!selectedDataset && (
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">
                  No dataset selected
                </span>
              </div>
            )}
          </div>

          {/* Messages - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="py-8">
                  {/* Welcome Section */}
                  <div className="text-center mb-8">
                    <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-heading text-lg uppercase tracking-wider mb-2">
                      Ask Your Data
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Ask questions in plain English and get insights with charts
                    </p>
                  </div>

                  {/* Workflow Templates */}
                  {selectedDataset && (
                    <div className="mb-8">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 text-center">
                        Quick Analysis Workflows
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4">
                        {WORKFLOW_TEMPLATES.map((workflow) => {
                          const Icon = workflow.icon;
                          return (
                            <button
                              key={workflow.id}
                              onClick={() => handleWorkflowClick(workflow)}
                              disabled={sending}
                              data-testid={`workflow-${workflow.id}`}
                              className="p-4 border border-border hover:border-primary bg-card/50 hover:bg-primary/5 transition-colors text-left group"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="font-mono text-xs uppercase tracking-wider">
                                  {workflow.name}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {workflow.category}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Prompts */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      Or ask anything
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        "What are the key insights?",
                        "Show me a summary",
                        "Find patterns",
                        "Compare categories",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="px-3 py-2 text-xs font-mono border border-border hover:border-primary hover:text-primary transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <div key={message.id || idx} id={`msg-${message.id}`}>
                    <MessageBubble
                      message={message}
                      onSaveAsTile={handleSaveAsTile}
                      savingTile={savingTile}
                      onSuggestionClick={handleSuggestionClick}
                      onClarify={handleClarify}
                      clarifying={clarifying}
                      onExpandDetail={handleExpandDetail}
                    />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Workflow Shortcuts - FIXED */}
          {messages.length > 0 && selectedDataset && (
            <div className="workflow-bar px-4 py-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">
                  Workflows:
                </span>
                {WORKFLOW_TEMPLATES.slice(0, 4).map((workflow) => {
                  const Icon = workflow.icon;
                  return (
                    <Tooltip key={workflow.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWorkflowClick(workflow)}
                          disabled={sending}
                          className="shrink-0 font-mono text-xs"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {workflow.name}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{workflow.prompt.substring(0, 60)}...</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area - FIXED at bottom */}
          <div className="chat-input-area">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={
                  selectedDataset
                    ? "Ask a question about your data..."
                    : "Select a dataset first..."
                }
                disabled={sending || !selectedDataset}
                className="flex-1 font-mono"
                data-testid="chat-input"
              />
              <Button
                onClick={() => handleSend()}
                disabled={sending || !input.trim() || !selectedDataset}
                className="font-mono uppercase"
                data-testid="chat-send-btn"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Detail Side Panel */}
        <Sheet open={!!detailPanel} onOpenChange={() => setDetailPanel(null)}>
          <SheetContent className="w-[500px] sm:w-[600px]">
            <SheetHeader>
              <SheetTitle className="font-heading uppercase tracking-wider">
                {detailPanel?.type === "chart" ? "Chart Details" : "Data Details"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {detailPanel?.type === "chart" && detailPanel.message.chart_config && (
                <div className="space-y-4">
                  <ChartRenderer
                    config={detailPanel.message.chart_config}
                    data={detailPanel.message.table_data}
                  />
                  <div className="p-4 bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Chart Configuration
                    </p>
                    <pre className="text-xs font-mono overflow-auto">
                      {JSON.stringify(detailPanel.message.chart_config, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {detailPanel?.type === "table" && detailPanel.message.table_data && (
                <div className="space-y-4">
                  <DataTable data={detailPanel.message.table_data} />
                  <div className="text-xs text-muted-foreground">
                    Total rows: {detailPanel.message.table_data.row_count || detailPanel.message.table_data.data?.length || 0}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
};

const MessageBubble = ({ 
  message, 
  onSaveAsTile, 
  savingTile, 
  onSuggestionClick,
  onClarify,
  clarifying,
  onExpandDetail
}) => {
  const [showCode, setShowCode] = useState(false);

  const getChartIcon = (type) => {
    switch (type) {
      case "bar":
        return BarChart3;
      case "line":
        return LineChart;
      case "pie":
        return PieChart;
      case "scatter":
        return ScatterChart;
      default:
        return BarChart3;
    }
  };

  // Calculate LLM Effectiveness Score (simulated based on response quality)
  const calculateEffectivenessScore = () => {
    let score = 50;
    if (message.table_data?.data?.length > 0) score += 20;
    if (message.chart_config?.type) score += 15;
    if (message.plan) score += 10;
    if (!message.error) score += 5;
    return Math.min(score, 100);
  };

  if (message.role === "user") {
    return (
      <div className="message message-user">
        <div className="message-content">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  const effectivenessScore = calculateEffectivenessScore();

  return (
    <div className="message message-assistant animate-fade-in">
      <div className="message-content max-w-full">
        {/* LLM Effectiveness Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              AI Analysis
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <Progress value={effectivenessScore} className="w-16 h-1.5" />
                  <span className="text-xs font-mono text-primary">{effectivenessScore}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">LLM Effectiveness Score based on response quality</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Plan */}
        {message.plan && (
          <div className="mb-3 p-3 bg-muted/50 border-l-2 border-primary">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              <Lightbulb className="h-3 w-3 inline mr-1" />
              What I did
            </p>
            <p className="text-sm">{message.plan}</p>
          </div>
        )}

        {/* Main Content */}
        <p className="text-sm mb-4">{message.content}</p>

        {/* Error */}
        {message.error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-destructive uppercase tracking-wider">
                Error
              </span>
            </div>
            <p className="text-sm text-destructive">{message.error}</p>
          </div>
        )}

        {/* Table Data */}
        {message.table_data && message.table_data.data && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Result Data
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExpandDetail(message, "table")}
                className="h-6 text-xs"
                data-testid="expand-table"
              >
                <Maximize2 className="h-3 w-3 mr-1" />
                Expand
              </Button>
            </div>
            <DataTable data={message.table_data} />
          </div>
        )}

        {/* Chart */}
        {message.chart_config && message.chart_config.type && (
          <div className="chart-container mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getChartIcon(message.chart_config.type);
                  return <Icon className="h-4 w-4 text-primary" />;
                })()}
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {message.chart_config.title || "Chart"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExpandDetail(message, "chart")}
                className="h-6 text-xs"
                data-testid="expand-chart"
              >
                <Maximize2 className="h-3 w-3 mr-1" />
                Expand
              </Button>
            </div>
            <ChartRenderer
              config={message.chart_config}
              data={message.table_data}
            />
          </div>
        )}

        {/* Code Toggle */}
        {message.code && (
          <Collapsible open={showCode} onOpenChange={setShowCode}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 font-mono text-xs"
              >
                <Code className="h-3 w-3 mr-2" />
                {showCode ? "Hide" : "Show"} Code
                {showCode ? (
                  <ChevronUp className="h-3 w-3 ml-2" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="code-block text-xs overflow-x-auto">
                <code>{message.code}</code>
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          {/* Clarify This */}
          {message.id && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onClarify(message)}
                    disabled={clarifying === message.id}
                    className="font-mono text-xs"
                    data-testid={`clarify-${message.id}`}
                  >
                    {clarifying === message.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <HelpCircle className="h-3 w-3 mr-2" />
                    )}
                    Clarify This
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Get a more detailed explanation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Save as Tile */}
          {message.id && (message.table_data || message.chart_config) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveAsTile(message)}
              disabled={savingTile === message.id}
              className="font-mono text-xs"
              data-testid={`save-tile-${message.id}`}
            >
              {savingTile === message.id ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <Bookmark className="h-3 w-3 mr-2" />
              )}
              Save as Tile
            </Button>
          )}
        </div>

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              <ChevronRight className="h-3 w-3 inline mr-1" />
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="px-2 py-1 text-xs font-mono border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
