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
            <Button 
              variant="outline"
              size="lg"
              className="gap-2 px-6"
              onClick={handleCreateWorkspace}
              disabled={creatingWorkspace}
              data-testid="empty-create-workspace-analysis"
            >
              {creatingWorkspace ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Create New Workspace
            </Button>
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
          <div className="chat-input-area">
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
                <Pin className="h-3 w-3 mr-2" />
              )}
              Pin Insight
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
