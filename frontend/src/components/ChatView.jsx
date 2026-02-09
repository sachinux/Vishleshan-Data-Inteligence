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
import { toast } from "sonner";
import axios from "axios";
import {
  Send,
  Loader2,
  Code,
  ChevronDown,
  ChevronUp,
  Bookmark,
  AlertCircle,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
} from "lucide-react";
import { ChartRenderer } from "@/components/ChartRenderer";
import { DataTable } from "@/components/DataTable";

export const ChatView = ({
  workspace,
  selectedDataset,
  createStoryTile,
  API,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [savingTile, setSavingTile] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch chat history
  const fetchMessages = useCallback(async () => {
    if (!workspace) return;
    try {
      const response = await axios.get(`${API}/chat/${workspace.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [API, workspace]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !workspace) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        workspace_id: workspace.id,
        message: userMessage,
        dataset_id: selectedDataset?.id,
      });

      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, id: Date.now().toString() },
        response.data,
      ]);
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
      toast.success("Saved as Story Tile");
    } catch (error) {
      toast.error("Failed to save as tile");
    } finally {
      setSavingTile(null);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
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
            Select a workspace to start chatting with your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area" data-testid="chat-view">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
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
        {!selectedDataset && (
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">
              No dataset selected
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-heading text-lg uppercase tracking-wider mb-2">
                Ask Your Data
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Ask questions in plain English and get insights with charts
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "What are the top 5 values?",
                  "Show me a summary",
                  "Compare by category",
                  "Find correlations",
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
          ) : (
            messages.map((message, idx) => (
              <MessageBubble
                key={message.id || idx}
                message={message}
                onSaveAsTile={handleSaveAsTile}
                savingTile={savingTile}
                onSuggestionClick={handleSuggestionClick}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
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
            onClick={handleSend}
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
  );
};

const MessageBubble = ({ message, onSaveAsTile, savingTile, onSuggestionClick }) => {
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

  if (message.role === "user") {
    return (
      <div className="message message-user">
        <div className="message-content">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message message-assistant animate-fade-in">
      <div className="message-content max-w-full">
        {/* Plan */}
        {message.plan && (
          <div className="mb-3 p-3 bg-muted/50 border-l-2 border-primary">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
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
            <DataTable data={message.table_data} />
          </div>
        )}

        {/* Chart */}
        {message.chart_config && message.chart_config.type && (
          <div className="chart-container mb-4">
            <div className="flex items-center gap-2 mb-3">
              {(() => {
                const Icon = getChartIcon(message.chart_config.type);
                return <Icon className="h-4 w-4 text-primary" />;
              })()}
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {message.chart_config.title || "Chart"}
              </span>
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

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
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

        {/* Save as Tile */}
        {message.id && (message.table_data || message.chart_config) && (
          <div className="mt-4 pt-4 border-t border-border">
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
              Save as Story Tile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
