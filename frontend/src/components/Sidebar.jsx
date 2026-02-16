import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import axios from "axios";
import { 
  Plus, 
  ChevronDown, 
  FileSpreadsheet,
  FileText,
  Table,
  Loader2,
  Sun,
  Moon,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  loading,
  onWorkspaceDeleted,
  onWorkspaceUpdated,
  onDatasetDeleted,
}) => {
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showEditWorkspace, setShowEditWorkspace] = useState(false);
  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [showDeleteDataset, setShowDeleteDataset] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editWorkspaceName, setEditWorkspaceName] = useState("");
  const [editWorkspaceDesc, setEditWorkspaceDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    setCreating(true);
    try {
      await createWorkspace(newWorkspaceName.trim());
      setShowNewWorkspace(false);
      setNewWorkspaceName("");
      toast.success("Workspace created successfully");
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleEditWorkspace = async () => {
    if (!editWorkspaceName.trim() || !currentWorkspace) return;
    
    setUpdating(true);
    try {
      const response = await axios.put(`${API}/workspaces/${currentWorkspace.id}`, {
        name: editWorkspaceName.trim(),
        description: editWorkspaceDesc.trim(),
      });
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated(response.data);
      }
      setShowEditWorkspace(false);
      toast.success("Workspace updated successfully");
    } catch (error) {
      toast.error("Failed to update workspace");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;
    
    setDeleting(true);
    try {
      await axios.delete(`${API}/workspaces/${currentWorkspace.id}`);
      if (onWorkspaceDeleted) {
        onWorkspaceDeleted(currentWorkspace.id);
      }
      setShowDeleteWorkspace(false);
      toast.success("Workspace deleted successfully");
    } catch (error) {
      toast.error("Failed to delete workspace");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteDataset = async () => {
    if (!datasetToDelete) return;
    
    setDeleting(true);
    try {
      await axios.delete(`${API}/datasets/${datasetToDelete.id}`);
      if (onDatasetDeleted) {
        onDatasetDeleted(datasetToDelete.id);
      }
      setShowDeleteDataset(false);
      setDatasetToDelete(null);
      toast.success("Dataset deleted successfully");
    } catch (error) {
      toast.error("Failed to delete dataset");
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = () => {
    if (currentWorkspace) {
      setEditWorkspaceName(currentWorkspace.name);
      setEditWorkspaceDesc(currentWorkspace.description || "");
      setShowEditWorkspace(true);
    }
  };

  const openDeleteDatasetDialog = (dataset, e) => {
    e.stopPropagation();
    setDatasetToDelete(dataset);
    setShowDeleteDataset(true);
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

      {/* Workspace Selector with Actions */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 justify-between text-xs h-9 rounded-lg"
                data-testid="workspace-selector"
              >
                <span className="truncate">{currentWorkspace?.name || "Select Workspace"}</span>
                <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[180px]">
              {workspaces.map((ws) => (
                <DropdownMenuItem 
                  key={ws.id} 
                  onClick={() => setCurrentWorkspace(ws)}
                  className="text-xs"
                >
                  <span className="truncate">{ws.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowNewWorkspace(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
                New Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Workspace Actions Menu */}
          {currentWorkspace && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-9 w-9 p-0 rounded-lg"
                  data-testid="workspace-actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={openEditDialog}
                  className="text-xs"
                >
                  <Pencil className="h-3 w-3 mr-2" />
                  Edit Workspace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteWorkspace(true)}
                  className="text-xs text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
                  <div
                    key={dataset.id}
                    className={`file-item group ${
                      selectedDataset?.id === dataset.id ? "active" : ""
                    }`}
                  >
                    <button
                      onClick={() => setSelectedDataset(dataset)}
                      data-testid={`dataset-${dataset.id}`}
                      className="flex-1 flex items-center gap-2 min-w-0"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 opacity-60" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-medium truncate">
                          {dataset.filename}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {dataset.row_count} rows × {dataset.column_count} cols
                        </p>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => openDeleteDatasetDialog(dataset, e)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      data-testid={`delete-dataset-${dataset.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
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
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your data analysis projects.
            </DialogDescription>
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

      {/* Edit Workspace Dialog */}
      <Dialog open={showEditWorkspace} onOpenChange={setShowEditWorkspace}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update the workspace name and description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Workspace name"
                value={editWorkspaceName}
                onChange={(e) => setEditWorkspaceName(e.target.value)}
                data-testid="edit-workspace-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Workspace description"
                value={editWorkspaceDesc}
                onChange={(e) => setEditWorkspaceDesc(e.target.value)}
                data-testid="edit-workspace-desc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditWorkspace(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditWorkspace}
              disabled={updating || !editWorkspaceName.trim()}
              data-testid="save-workspace-btn"
            >
              {updating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Confirmation */}
      <AlertDialog open={showDeleteWorkspace} onOpenChange={setShowDeleteWorkspace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Workspace
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>"{currentWorkspace?.name}"</strong>?
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone. This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>All datasets ({datasets.length} files)</li>
                <li>All chat history and analysis</li>
                <li>All story tiles and storyboards</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-workspace"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dataset Confirmation */}
      <AlertDialog open={showDeleteDataset} onOpenChange={setShowDeleteDataset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Dataset
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>"{datasetToDelete?.filename}"</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                This will remove the dataset from this workspace. Any analysis or charts referencing this data may no longer work correctly.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDatasetToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDataset}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-dataset"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Dataset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};
