import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ThemeProvider";
import { 
  Plus, 
  ChevronDown, 
  FileSpreadsheet,
  FileText,
  Table,
  Loader2,
  Sun,
  Moon
} from "lucide-react";

export const Sidebar = ({
  workspaces,
  currentWorkspace,
  setCurrentWorkspace,
  createWorkspace,
  navItems,
  activeView,
  setActiveView,
  datasets,
  selectedDataset,
  setSelectedDataset,
  dataProfile,
  loading
}) => {
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    setCreating(true);
    try {
      await createWorkspace(newWorkspaceName.trim());
      setShowNewWorkspace(false);
      setNewWorkspaceName("");
    } catch (error) {
      console.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "csv":
      case "excel":
        return FileSpreadsheet;
      case "pdf":
        return FileText;
      case "google_sheets":
        return Table;
      default:
        return FileSpreadsheet;
    }
  };

  return (
    <aside className="sidebar" data-testid="sidebar">
      {/* Header with Theme Toggle */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-sm tracking-tight">
              Data Storyteller
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Studio
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            data-testid="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between text-xs h-9 rounded-lg"
              data-testid="workspace-selector"
            >
              <span className="truncate">{currentWorkspace?.name || "Select Workspace"}</span>
              <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            {workspaces.map((ws) => (
              <DropdownMenuItem 
                key={ws.id} 
                onClick={() => setCurrentWorkspace(ws)}
                className="text-xs"
              >
                <span className="truncate">{ws.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem 
              onClick={() => setShowNewWorkspace(true)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
              New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">
          Navigation
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                data-testid={`nav-${item.id}`}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  activeView === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Datasets List */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-3 border-b border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Datasets ({datasets.length})
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {datasets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No datasets yet
            </p>
          ) : (
            <div className="space-y-1">
              {datasets.map((dataset) => {
                const Icon = getFileIcon(dataset.file_type);
                return (
                  <button
                    key={dataset.id}
                    onClick={() => setSelectedDataset(dataset)}
                    data-testid={`dataset-${dataset.id}`}
                    className={`file-item w-full ${
                      selectedDataset?.id === dataset.id ? "active" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 opacity-60" />
                    <div className="flex-1 min-w-0 ml-2">
                      <p className="text-xs font-medium truncate">
                        {dataset.filename}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {dataset.row_count} rows × {dataset.column_count} cols
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Profile */}
      {dataProfile && selectedDataset && (
        <div className="flex-shrink-0 p-3 border-t border-border bg-secondary/30">
          <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">
            Quick Stats
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-card border border-border">
              <p className="text-sm font-semibold">{dataProfile.row_count}</p>
              <p className="text-[9px] text-muted-foreground">Rows</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-card border border-border">
              <p className="text-sm font-semibold">{dataProfile.column_count}</p>
              <p className="text-[9px] text-muted-foreground">Cols</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-card border border-border">
              <p className="text-[10px] font-semibold">{dataProfile.memory_usage}</p>
              <p className="text-[9px] text-muted-foreground">Size</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex-shrink-0 p-3 border-t border-border flex items-center justify-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-[10px] text-muted-foreground">
            Processing...
          </span>
        </div>
      )}

      {/* New Workspace Dialog */}
      <Dialog open={showNewWorkspace} onOpenChange={setShowNewWorkspace}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              data-testid="new-workspace-input"
              onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewWorkspace(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={creating || !newWorkspaceName.trim()}
              data-testid="create-workspace-btn"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};
