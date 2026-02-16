import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const ChatSettings = ({ 
  open, 
  onOpenChange, 
  settings, 
  onSave,
  loading 
}) => {
  const [context, setContext] = useState("");
  const [responseStyle, setResponseStyle] = useState("");

  // Sync with parent settings
  useEffect(() => {
    if (settings) {
      setContext(settings.context || "");
      setResponseStyle(settings.response_style || "");
    }
  }, [settings, open]);

  const handleSave = () => {
    onSave({
      context: context.trim(),
      response_style: responseStyle.trim()
    });
  };

  const contextRemaining = 1000 - context.length;
  const styleRemaining = 50 - responseStyle.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="chat-settings-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <Separator className="my-2" />

        <div className="space-y-6 py-4">
          {/* Context Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Context</Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              What would you like the AI to know?
            </p>
            <Textarea
              placeholder="Include instructions you would like the AI to remember throughout your conversations."
              value={context}
              onChange={(e) => setContext(e.target.value.slice(0, 1000))}
              className="min-h-[120px] resize-none font-mono text-sm"
              data-testid="settings-context-input"
            />
            <div className="text-right text-xs text-muted-foreground">
              {context.length} / 1000
            </div>
          </div>

          {/* Response Style Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-green-600 text-white text-xs font-bold">
                2
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <Label className="font-semibold">Response style</Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              How would you like the AI to respond?
            </p>
            <Input
              placeholder="e.g. professional, friendly, succinct, French"
              value={responseStyle}
              onChange={(e) => setResponseStyle(e.target.value.slice(0, 50))}
              className="font-mono text-sm"
              data-testid="settings-style-input"
            />
            <div className="text-right text-xs text-muted-foreground">
              {responseStyle.length} / 50
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="save-settings-btn"
          >
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
