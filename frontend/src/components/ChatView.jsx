import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Settings,
  Table2,
  PanelTopClose,
  Upload,
  Paperclip,
  FileSpreadsheet,
  FileText,
  BookmarkPlus,
  Library,
  Trash2,
  Plus,
  Star,
  StarOff,
  FolderOpen,
  Database,
} from "lucide-react";
import { ChartRenderer } from "@/components/ChartRenderer";
import { DataTable } from "@/components/DataTable";
import { ChatSettings } from "@/components/ChatSettings";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

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
  chatSettings,
  updateChatSettings,
  loading: parentLoading,
  showGridSplit,
  setShowGridSplit,
  uploadFile,
  onDatasetUploaded,
  workspaces,
  onCreateWorkspace,
  onSelectWorkspace,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [savingTile, setSavingTile] = useState(null);
  const [showQueryNav, setShowQueryNav] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [detailPanel, setDetailPanel] = useState(null);
  const [clarifying, setClarifying] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [lastQuery, setLastQuery] = useState(null);  // Store last query for retry
  
  // File upload states
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  // Prompt library states
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  
  // Workspace selection states
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
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("Custom");
  
  const messagesEndRef = useRef(null);

  // Load saved prompts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`vishleshan-prompts-${workspace?.id}`);
    if (stored) {
      setSavedPrompts(JSON.parse(stored));
    }
  }, [workspace?.id]);

  // Save prompts to localStorage
  const savePromptsToStorage = (prompts) => {
    localStorage.setItem(`vishleshan-prompts-${workspace?.id}`, JSON.stringify(prompts));
    setSavedPrompts(prompts);
  };

  // Handle file upload in chat
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0 || !workspace) return;
    
    setUploadingFile(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await axios.post(
          `${API_BASE}/workspaces/${workspace.id}/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        
        if (onDatasetUploaded) {
          onDatasetUploaded(response.data);
        }
        toast.success(`Uploaded: ${file.name}`);
      }
      setShowFileUpload(false);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Save current prompt
  const handleSavePrompt = () => {
    if (!input.trim() || !newPromptName.trim()) return;
    
    const newPrompt = {
      id: Date.now().toString(),
      name: newPromptName,
      prompt: input,
      category: newPromptCategory,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    
    savePromptsToStorage([...savedPrompts, newPrompt]);
    setNewPromptName("");
    setNewPromptCategory("Custom");
    setShowSavePrompt(false);
    toast.success("Prompt saved to library!");
  };

  // Delete saved prompt
  const handleDeletePrompt = (promptId) => {
    const updated = savedPrompts.filter(p => p.id !== promptId);
    savePromptsToStorage(updated);
    toast.success("Prompt deleted");
  };

  // Toggle favorite
  const handleToggleFavorite = (promptId) => {
    const updated = savedPrompts.map(p => 
      p.id === promptId ? { ...p, isFavorite: !p.isFavorite } : p
    );
    savePromptsToStorage(updated);
  };

  // Use saved prompt
  const handleUsePrompt = (prompt) => {
    setInput(prompt.prompt);
    setShowPromptLibrary(false);
  };

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

  // Progress state for loading indicator
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");

  useEffect(() => {
    const steps = [
      { progress: 15, text: "Understanding your question..." },
      { progress: 35, text: "Analyzing dataset..." },
      { progress: 55, text: "Running calculations..." },
      { progress: 75, text: "Generating insights..." },
      { progress: 90, text: "Preparing visualization..." },
    ];

    if (sending) {
      setProgress(0);
      setProgressStep(steps[0].text);
      
      let stepIndex = 0;
      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setProgress(steps[stepIndex].progress);
          setProgressStep(steps[stepIndex].text);
        }
      }, 800);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setProgressStep("");
      }, 300);
    }
  }, [sending]);

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

  // Handle retry analysis
  const handleRetry = async (message) => {
    if (!workspace || !selectedDataset) {
      toast.error("Please select a dataset first");
      return;
    }
    
    // Find the last user message before this assistant message
    const msgIndex = messages.findIndex(m => m.id === message.id);
    let userQuery = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userQuery = messages[i].content;
        break;
      }
    }
    
    if (!userQuery) {
      toast.error("Could not find original query to retry");
      return;
    }
    
    setRetrying(true);
    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        workspace_id: workspace.id,
        message: userQuery,
        dataset_id: selectedDataset.id,
      });
      
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `🔄 Retry: ${userQuery}`, id: Date.now().toString() },
        response.data,
      ]);
      toast.success("Analysis retried!");
    } catch (error) {
      toast.error("Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  // Handle switch to alternative method
  const handleSwitchMethod = async (method) => {
    if (!workspace || !selectedDataset) {
      toast.error("Please select a dataset first");
      return;
    }
    
    setSending(true);
    try {
      const response = await axios.post(`${API_BASE}/chat/alternative`, {
        workspace_id: workspace.id,
        dataset_id: selectedDataset.id,
        method: method,
      });
      
      const methodNames = {
        statistical: "Statistical Summary",
        aggregation: "Simple Aggregation",
        chart_only: "Chart Only"
      };
      
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `📊 ${methodNames[method] || method}`, id: Date.now().toString() },
        response.data,
      ]);
      toast.success(`${methodNames[method] || method} generated!`);
    } catch (error) {
      toast.error(`Failed to run ${method} analysis`);
    } finally {
      setSending(false);
    }
  };

  const handleExpandDetail = (message, type) => {
    setDetailPanel({ message, type });
  };

  // Get user queries for Query Navigator
  const userQueries = messages.filter((m) => m.role === "user");

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold mb-4 tracking-tight">
            Choose a Workspace to Analyze Your Data
          </h1>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
            Insights are generated inside a workspace. Select a workspace to explore datasets, 
            ask questions, and generate AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button 
              size="lg"
              className="gap-2 px-6 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleCreateWorkspace}
              disabled={creatingWorkspace}
              data-testid="empty-create-workspace-analysis"
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
                  data-testid="empty-select-workspace-analysis"
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
                        <Database className="h-4 w-4 text-muted-foreground" />
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
              No data yet? Upload a dataset after creating a workspace.
            </p>
          </div>
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
              <span className="text-xs uppercase tracking-wider font-medium">
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
                      className={`w-full text-left p-2 text-xs font-mono rounded-lg transition-colors ${
                        selectedQuery === query.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      <span className="opacity-50 mr-2">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {query.content?.substring(0, 30)}...
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Content */}
        <div className="chat-main">
          {/* Header - FIXED */}
          <div className="chat-header p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={showQueryNav ? "default" : "outline"}
                size="sm"
                onClick={() => setShowQueryNav(!showQueryNav)}
                className="h-8 rounded-lg"
                data-testid="toggle-query-nav"
              >
                <History className="h-4 w-4 mr-2" />
                Queries
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h2 className="font-semibold text-sm">
                  Chat & Analysis
                </h2>
                {selectedDataset && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Analyzing: {selectedDataset.filename}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!selectedDataset && (
                <div className="flex items-center gap-2 text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">
                    No dataset selected
                  </span>
                </div>
              )}
              {selectedDataset && setShowGridSplit && (
                <Button
                  variant={showGridSplit ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGridSplit(!showGridSplit)}
                  className="h-8 rounded-lg"
                  data-testid="toggle-grid-split"
                >
                  {showGridSplit ? (
                    <>
                      <PanelTopClose className="h-4 w-4 mr-2" />
                      Hide Table
                    </>
                  ) : (
                    <>
                      <Table2 className="h-4 w-4 mr-2" />
                      Show Table
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8 rounded-lg"
                data-testid="open-chat-settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Messages - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="py-8">
                  {/* Welcome Section */}
                  <div className="text-center mb-8">
                    <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
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
                          className="px-3 py-2 text-xs font-mono border border-border rounded-lg hover:border-primary hover:bg-secondary transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, idx) => (
                    <div key={message.id || idx} id={`msg-${message.id}`}>
                      <MessageBubble
                        message={message}
                        onSaveAsTile={handleSaveAsTile}
                        savingTile={savingTile}
                        onSuggestionClick={handleSuggestionClick}
                        onClarify={handleClarify}
                        clarifying={clarifying}
                        onExpandDetail={handleExpandDetail}
                        onRetry={handleRetry}
                        onSwitchMethod={handleSwitchMethod}
                        retrying={retrying}
                      />
                    </div>
                  ))}
                  
                  {/* Progress Indicator */}
                  {sending && (
                    <div className="message message-assistant animate-fade-in">
                      <div className="message-content max-w-md">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm font-medium">{progressStep}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Processing</span>
                            <span>{progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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

          {/* Enhanced Input Area */}
          <div className="chat-input-area chat-input-prominent">
            {/* File Upload Mini Panel */}
            {showFileUpload && (
              <div 
                className={`mb-3 p-4 border-2 border-dashed rounded-lg transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                  accept=".csv,.xlsx,.xls,.pdf"
                  multiple
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Quick Upload</p>
                      <p className="text-xs text-muted-foreground">
                        Drop files or click to browse • CSV, Excel, PDF
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          Browse
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFileUpload(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Row */}
            <div className="flex flex-col gap-2">
              {/* Action Buttons Row */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      className="h-8 w-8 p-0"
                      data-testid="chat-upload-btn"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload file</TooltipContent>
                </Tooltip>

                <Popover open={showPromptLibrary} onOpenChange={setShowPromptLibrary}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      data-testid="prompt-library-btn"
                    >
                      <Library className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-3 border-b border-border">
                      <h4 className="font-semibold text-sm">Prompt Library</h4>
                      <p className="text-xs text-muted-foreground">
                        Your saved prompts
                      </p>
                    </div>
                    <ScrollArea className="h-[250px]">
                      {savedPrompts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Library className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No saved prompts yet
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {/* Favorites first */}
                          {savedPrompts
                            .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                            .map((prompt) => (
                            <div
                              key={prompt.id}
                              className="group p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div 
                                  className="flex-1 min-w-0"
                                  onClick={() => handleUsePrompt(prompt)}
                                >
                                  <div className="flex items-center gap-2">
                                    {prompt.isFavorite && (
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    )}
                                    <span className="text-sm font-medium truncate">
                                      {prompt.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {prompt.prompt}
                                  </p>
                                  <Badge variant="secondary" className="text-[10px] mt-1">
                                    {prompt.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(prompt.id);
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    {prompt.isFavorite ? (
                                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    ) : (
                                      <StarOff className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePrompt(prompt.id);
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSavePrompt(true)}
                      disabled={!input.trim()}
                      className="h-8 w-8 p-0"
                      data-testid="save-prompt-btn"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save prompt</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGridSplit(!showGridSplit)}
                      className={`h-8 w-8 p-0 ${showGridSplit ? 'text-primary bg-primary/10' : ''}`}
                      data-testid="toggle-grid-split"
                    >
                      <Table2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{showGridSplit ? 'Hide' : 'Show'} data grid</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                      className="h-8 w-8 p-0"
                      data-testid="chat-settings-btn"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat settings</TooltipContent>
                </Tooltip>

                <div className="flex-1" />

                <span className="text-xs text-muted-foreground">
                  {input.length}/500
                </span>
              </div>

              {/* Textarea Input */}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    selectedDataset
                      ? "Ask about your data... (Shift+Enter for new line)"
                      : "Select a dataset first..."
                  }
                  disabled={sending || !selectedDataset}
                  className="flex-1 font-mono min-h-[44px] max-h-[120px] resize-none"
                  rows={1}
                  data-testid="chat-input"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={sending || !input.trim() || !selectedDataset}
                  className="font-mono uppercase self-end h-[44px]"
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
        </div>

        {/* Save Prompt Dialog */}
        <Dialog open={showSavePrompt} onOpenChange={setShowSavePrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Prompt to Library</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Prompt Name</label>
                <Input
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="e.g., Sales Analysis Query"
                  data-testid="prompt-name-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["Custom", "Analysis", "Visualization", "Summary", "Comparison"].map((cat) => (
                    <Badge
                      key={cat}
                      variant={newPromptCategory === cat ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setNewPromptCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Prompt Preview</label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {input || "No prompt entered"}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSavePrompt(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSavePrompt}
                disabled={!newPromptName.trim() || !input.trim()}
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save Prompt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Chat Settings Modal */}
        <ChatSettings
          open={showSettings}
          onOpenChange={setShowSettings}
          settings={chatSettings}
          onSave={async (settings) => {
            try {
              await updateChatSettings(settings);
              toast.success("Settings saved!");
              setShowSettings(false);
            } catch (error) {
              toast.error("Failed to save settings");
            }
          }}
          loading={parentLoading}
        />
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
  onExpandDetail,
  onRetry,
  onSwitchMethod,
  retrying
}) => {
  const [showLayer2, setShowLayer2] = useState(false);  // AI Reasoning - collapsed by default
  const [showLayer3, setShowLayer3] = useState(false);  // Runtime - collapsed by default
  const [showLearnMore, setShowLearnMore] = useState(false);

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

  // Check if analysis failed
  const analysisFailed = message.analysis_success === false || message.error;
  const confidenceScore = message.confidence_score;

  return (
    <div className="message message-assistant animate-fade-in">
      <div className="message-content max-w-full">
        {/* ═══════════════════════════════════════════════════════════════════
            LAYER 1 - BUSINESS INTELLIGENCE (Always Visible)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="layer-1-bi">
          {/* Header with confidence (only shown on success) */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                AI Analysis
              </span>
              {message.analysis_method && message.analysis_method !== "auto" && (
                <Badge variant="secondary" className="text-[10px]">
                  {message.analysis_method}
                </Badge>
              )}
            </div>
            {/* Only show confidence when analysis succeeds */}
            {!analysisFailed && confidenceScore && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <Progress value={confidenceScore} className="w-16 h-1.5" />
                      <span className="text-xs font-mono text-primary">{confidenceScore}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Analysis confidence based on data quality and results</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Main Content / Summary */}
          <p className="text-sm mb-4">{message.content}</p>

          {/* Key Findings (from layer1_insight) */}
          {message.layer1_insight?.key_findings?.length > 0 && !analysisFailed && (
            <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <p className="text-xs text-primary uppercase tracking-wider mb-2 font-semibold">
                Key Findings
              </p>
              <ul className="space-y-1">
                {message.layer1_insight.key_findings.map((finding, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Data */}
          {message.table_data && message.table_data.data && !analysisFailed && (
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
          {message.chart_config && message.chart_config.type && !analysisFailed && (
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

          {/* Recommendations */}
          {message.layer1_insight?.recommendations?.length > 0 && !analysisFailed && (
            <div className="mb-4 flex flex-wrap gap-2">
              {message.layer1_insight.recommendations.map((rec, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {rec}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            FAILURE STATE - Redesigned Alert with Actions
        ═══════════════════════════════════════════════════════════════════ */}
        {analysisFailed && (
          <div className="failure-state mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                  Analysis temporarily unavailable
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  The primary analysis method encountered an issue. Try an alternative approach below.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry && onRetry(message)}
                    disabled={retrying}
                    className="text-xs border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10"
                    data-testid="retry-analysis"
                  >
                    {retrying ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Zap className="h-3 w-3 mr-1" />
                    )}
                    Retry
                  </Button>
                  
                  {/* Switch Method Dropdown */}
                  {message.alternative_methods?.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10"
                          data-testid="switch-method-btn"
                        >
                          <GitBranch className="h-3 w-3 mr-1" />
                          Switch Method
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-0" align="start">
                        <div className="p-2">
                          <p className="text-xs text-muted-foreground px-2 py-1 mb-1">
                            Alternative analysis methods
                          </p>
                          {message.alternative_methods.map((method) => (
                            <button
                              key={method}
                              onClick={() => onSwitchMethod && onSwitchMethod(method)}
                              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors flex items-center gap-2"
                              data-testid={`switch-to-${method}`}
                            >
                              {method === "statistical" && <BarChart3 className="h-4 w-4 text-blue-500" />}
                              {method === "aggregation" && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {method === "chart_only" && <PieChart className="h-4 w-4 text-purple-500" />}
                              <span className="capitalize">{method.replace("_", " ")}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Learn More Collapsible */}
                <Collapsible open={showLearnMore} onOpenChange={setShowLearnMore}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-3 w-3" />
                      Learn more
                      {showLearnMore ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-2">
                      <p><strong>Why did this happen?</strong></p>
                      <p>The AI-generated analysis code encountered an execution error. This can happen due to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Unexpected data format or missing columns</li>
                        <li>Complex calculation that exceeded runtime limits</li>
                        <li>Syntax issues in generated code</li>
                      </ul>
                      <p className="mt-2"><strong>What can you do?</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Retry:</strong> Try the same analysis again</li>
                        <li><strong>Statistical Summary:</strong> Get basic stats without complex code</li>
                        <li><strong>Simple Aggregation:</strong> Calculate sum, mean, etc.</li>
                        <li><strong>Chart Only:</strong> Generate a visualization directly</li>
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            LAYER 2 - AI REASONING (Collapsible, Hidden by Default)
        ═══════════════════════════════════════════════════════════════════ */}
        {message.layer2_reasoning && (
          <Collapsible open={showLayer2} onOpenChange={setShowLayer2}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 font-mono text-xs w-full justify-between hover:bg-muted/50"
                data-testid="toggle-layer2"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  What I Did (AI Reasoning)
                </span>
                {showLayer2 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                {message.layer2_reasoning.methodology && (
                  <div className="mb-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 font-semibold">
                      Methodology
                    </p>
                    <p className="text-sm">{message.layer2_reasoning.methodology}</p>
                  </div>
                )}
                {message.layer2_reasoning.steps?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 font-semibold">
                      Steps Taken
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                      {message.layer2_reasoning.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {message.layer2_reasoning.data_quality_notes?.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 font-semibold">
                      Data Quality Notes
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {message.layer2_reasoning.data_quality_notes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span>•</span> {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            LAYER 3 - RUNTIME EXECUTION (Collapsible, Hidden by Default)
        ═══════════════════════════════════════════════════════════════════ */}
        {(message.code || message.layer3_runtime) && (
          <Collapsible open={showLayer3} onOpenChange={setShowLayer3}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 font-mono text-xs w-full justify-between hover:bg-muted/50"
                data-testid="toggle-layer3"
              >
                <span className="flex items-center gap-2">
                  <Code className="h-3 w-3 text-blue-500" />
                  Runtime Details (Technical)
                </span>
                {showLayer3 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-3">
                {/* Execution Time */}
                {message.layer3_runtime?.execution_time_ms !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-blue-500 font-semibold">Execution:</span>
                    <span>{message.layer3_runtime.execution_time_ms}ms</span>
                  </div>
                )}
                
                {/* Code */}
                {message.code && (
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 font-semibold">
                      Generated Code
                    </p>
                    <pre className="code-block text-xs overflow-x-auto bg-muted rounded-md p-2">
                      <code>{message.code}</code>
                    </pre>
                  </div>
                )}
                
                {/* Error Details (for debugging) */}
                {message.layer3_runtime?.error_details && (
                  <div>
                    <p className="text-xs text-red-500 uppercase tracking-wider mb-1 font-semibold">
                      Error Details
                    </p>
                    <pre className="text-xs text-red-400 bg-red-500/10 p-2 rounded-md overflow-x-auto">
                      {message.layer3_runtime.error_details}
                    </pre>
                  </div>
                )}
                
                {/* Stack Trace */}
                {message.layer3_runtime?.stack_trace && (
                  <div>
                    <p className="text-xs text-red-500 uppercase tracking-wider mb-1 font-semibold">
                      Stack Trace
                    </p>
                    <pre className="text-xs text-muted-foreground bg-muted p-2 rounded-md overflow-x-auto">
                      {message.layer3_runtime.stack_trace}
                    </pre>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Buttons (only show on success) */}
        {!analysisFailed && (
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
                  <Pin className="h-3 w-3 mr-2" />
                )}
                Pin Insight
              </Button>
            )}
          </div>
        )}

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
