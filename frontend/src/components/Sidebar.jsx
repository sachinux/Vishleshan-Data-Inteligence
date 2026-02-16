import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { 
  Plus, 
  ChevronDown, 
  FileSpreadsheet,
  FileText,
  Table,
  Loader2
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
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h1 className="font-heading text-base font-bold tracking-wider text-primary uppercase">
          Data Storyteller
        </h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">
          Studio
        </p>
      </div>

      {/* Workspace Selector - Fixed */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between font-mono text-[10px] uppercase tracking-wider h-8"
              data-testid="workspace-selector"
            >
              <span className="truncate">{currentWorkspace?.name || "Select Workspace"}</span>
              <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            {workspaces.map((ws) => (
              <DropdownMenuItem 
                key={ws.id} 
                onClick={() => setCurrentWorkspace(ws)}
                className="font-mono text-xs"
              >
                <span className="truncate">{ws.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem 
              onClick={() => setShowNewWorkspace(true)}
              className="font-mono text-xs text-primary"
            >
              <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
              New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation - Fixed */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <p className="text-[10px] text-muted-foreground mb-2 tracking-widest uppercase">Navigation</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                data-testid={`nav-${item.id}`}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                  activeView === item.id
                    ? "bg-primary/10 text-primary border border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                }`}
              >
                <Icon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Datasets List - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-3 border-b border-border">
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
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
                    className={`w-full flex items-center gap-2 p-2 text-left border transition-colors ${
                      selectedDataset?.id === dataset.id 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50 bg-background"
                    }`}
                  >
                    <Icon className="h-3 w-3 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">
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

      {/* Quick Profile - Fixed at bottom */}
      {dataProfile && selectedDataset && (
        <div className="flex-shrink-0 p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-2 tracking-widest uppercase">
            Quick Stats
          </p>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rows</span>
              <span className="text-primary">{dataProfile.row_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Columns</span>
              <span className="text-primary">{dataProfile.column_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory</span>
              <span className="text-primary">{dataProfile.memory_usage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex-shrink-0 p-3 border-t border-border flex items-center justify-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Processing...
          </span>
        </div>
      )}

      {/* New Workspace Dialog */}
      <Dialog open={showNewWorkspace} onOpenChange={setShowNewWorkspace}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase tracking-wider">
              New Workspace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="font-mono"
              data-testid="new-workspace-input"
              onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewWorkspace(false)}
              className="font-mono uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={creating || !newWorkspaceName.trim()}
              className="font-mono uppercase"
              data-testid="create-workspace-btn"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};
