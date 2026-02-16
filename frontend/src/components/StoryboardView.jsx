import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  GripVertical,
  Edit2,
  FileText,
  Presentation,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const StoryboardView = ({
  workspace,
  storyTiles,
  storyboards,
  generateStoryboard,
  updateStoryboard,
  exportStoryboard,
  loading,
}) => {
  const [selectedStoryboard, setSelectedStoryboard] = useState(null);
  const [editingFrame, setEditingFrame] = useState(null);
  const [showNewStoryboard, setShowNewStoryboard] = useState(false);
  const [newTitle, setNewTitle] = useState("Data Story");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (storyboards.length > 0 && !selectedStoryboard) {
      setSelectedStoryboard(storyboards[0]);
    }
  }, [storyboards, selectedStoryboard]);

  const handleGenerateStoryboard = async () => {
    if (!newTitle.trim()) return;

    setGenerating(true);
    try {
      const newStoryboard = await generateStoryboard(newTitle);
      setSelectedStoryboard(newStoryboard);
      setShowNewStoryboard(false);
      setNewTitle("Data Story");
      toast.success("Storyboard generated");
    } catch (error) {
      toast.error("Failed to generate storyboard. Make sure you have story tiles.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format) => {
    if (!selectedStoryboard) return;

    setExporting(format);
    try {
      await exportStoryboard(selectedStoryboard.id, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handleFrameEdit = async (frameId, updates) => {
    if (!selectedStoryboard) return;

    const updatedFrames = selectedStoryboard.frames.map((frame) =>
      frame.id === frameId ? { ...frame, ...updates } : frame
    );

    try {
      const updated = await updateStoryboard(selectedStoryboard.id, {
        frames: updatedFrames,
      });
      setSelectedStoryboard(updated);
      setEditingFrame(null);
      toast.success("Frame updated");
    } catch (error) {
      toast.error("Failed to update frame");
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const frames = [...selectedStoryboard.frames];
    const [removed] = frames.splice(draggedIndex, 1);
    frames.splice(index, 0, removed);

    const reorderedFrames = frames.map((frame, idx) => ({
      ...frame,
      order: idx,
    }));

    setSelectedStoryboard({
      ...selectedStoryboard,
      frames: reorderedFrames,
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !selectedStoryboard) return;

    try {
      await updateStoryboard(selectedStoryboard.id, {
        frames: selectedStoryboard.frames,
      });
    } catch (error) {
      console.error("Failed to save frame order");
    }
    setDraggedIndex(null);
  };

  const getTileById = (tileId) => {
    return storyTiles.find((tile) => tile.id === tileId);
  };

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground text-sm">
            Select a workspace to view storyboards
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="storyboard-layout" data-testid="storyboard-view">
      {/* Left Panel - Storyboard List */}
      <div className="storyboard-sidebar">
        <div className="storyboard-sidebar-header">
          <h2 className="font-semibold text-sm uppercase tracking-wider mb-4">
            Storyboards
          </h2>
          <Button
            onClick={() => setShowNewStoryboard(true)}
            disabled={storyTiles.length === 0}
            className="w-full text-xs"
            data-testid="generate-storyboard-btn"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Storyboard
          </Button>
          {storyTiles.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Pin insights from chat first
            </p>
          )}
        </div>

        <div className="storyboard-sidebar-content">
          <div className="p-4 space-y-2">
            {storyboards.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No storyboards yet
              </p>
            ) : (
              storyboards.map((sb) => (
                <button
                  key={sb.id}
                  onClick={() => setSelectedStoryboard(sb)}
                  data-testid={`storyboard-item-${sb.id}`}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedStoryboard?.id === sb.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium truncate">{sb.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sb.frames?.length || 0} frames
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Story Tiles */}
          {storyTiles.length > 0 && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Story Tiles: {storyTiles.length}
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {storyTiles.map((tile) => (
                  <div
                    key={tile.id}
                    className="p-2 border border-border rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <p className="text-xs truncate">{tile.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Storyboard Editor */}
      <div className="storyboard-main">
        {selectedStoryboard ? (
          <>
            {/* Header */}
            <div className="storyboard-main-header flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg uppercase tracking-wider">
                  {selectedStoryboard.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedStoryboard.frames?.length || 0} frames • Drag to reorder
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pdf")}
                  disabled={exporting === "pdf"}
                  className="text-xs"
                  data-testid="export-pdf-btn"
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <FileText className="h-4 w-4 mr-1" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("pptx")}
                  disabled={exporting === "pptx"}
                  className="text-xs"
                  data-testid="export-pptx-btn"
                >
                  {exporting === "pptx" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Presentation className="h-4 w-4 mr-1" />
                  )}
                  PPTX
                </Button>
              </div>
            </div>

            {/* Frames */}
            <div className="storyboard-main-content">
              <div className="space-y-4">
                {selectedStoryboard.frames?.map((frame, index) => (
                  <div
                    key={frame.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    data-testid={`frame-${frame.id}`}
                    className={`storyboard-frame p-5 border border-border rounded-xl bg-card hover:border-primary/30 transition-all ${
                      draggedIndex === index ? "opacity-50 scale-[0.98]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Drag Handle & Number */}
                      <div className="flex items-center gap-2 text-muted-foreground cursor-grab pt-1">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base uppercase tracking-wide mb-2">
                          {frame.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {frame.summary}
                        </p>

                        {/* Included Tiles */}
                        {frame.tile_refs?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Included Tiles
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {frame.tile_refs.map((tileId) => {
                                const tile = getTileById(tileId);
                                return tile ? (
                                  <span
                                    key={tileId}
                                    className="px-2 py-1 text-xs bg-secondary rounded-md"
                                  >
                                    {tile.title}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Speaker Notes */}
                        {frame.narrative_notes && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Speaker Notes
                            </p>
                            <p className="text-sm italic text-muted-foreground">
                              {frame.narrative_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingFrame(frame)}
                        className="shrink-0 h-8 w-8 p-0"
                        data-testid={`edit-frame-${frame.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Create Your Story</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a storyboard from your pinned insights to create a presentation
              </p>
              <Button
                onClick={() => setShowNewStoryboard(true)}
                disabled={storyTiles.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Storyboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Storyboard Dialog */}
      <Dialog open={showNewStoryboard} onOpenChange={setShowNewStoryboard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Storyboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter storyboard title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              data-testid="storyboard-title-input"
            />
            <p className="text-xs text-muted-foreground">
              AI will organize your {storyTiles.length} pinned insights into a narrative flow.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStoryboard(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateStoryboard}
              disabled={generating || !newTitle.trim()}
              data-testid="confirm-generate-btn"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Frame Dialog */}
      <Dialog open={!!editingFrame} onOpenChange={() => setEditingFrame(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Frame</DialogTitle>
          </DialogHeader>
          {editingFrame && (
            <EditFrameForm
              frame={editingFrame}
              onSave={handleFrameEdit}
              onCancel={() => setEditingFrame(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EditFrameForm = ({ frame, onSave, onCancel }) => {
  const [title, setTitle] = useState(frame.title);
  const [summary, setSummary] = useState(frame.summary);
  const [narrativeNotes, setNarrativeNotes] = useState(frame.narrative_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(frame.id, {
      title,
      summary,
      narrative_notes: narrativeNotes,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4 py-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="edit-frame-title"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Summary</label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          data-testid="edit-frame-summary"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Speaker Notes</label>
        <Textarea
          value={narrativeNotes}
          onChange={(e) => setNarrativeNotes(e.target.value)}
          rows={4}
          placeholder="Notes for presenting this frame..."
          data-testid="edit-frame-notes"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} data-testid="save-frame-btn">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
};
