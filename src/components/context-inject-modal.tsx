import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  context: string;
  title?: string;
}

export function ContextInjectModal({ open, onOpenChange, context, title }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(context);
      setCopied(true);
      toast.success("Context copied!", {
        description: "Paste it into your AI chat.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy", { description: "Select the text manually." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-strong border-primary/20">
        <DialogHeader>
          <DialogTitle>{title ?? "Inject context"}</DialogTitle>
          <DialogDescription>
            Copy the formatted context below and paste it into any AI chat.
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[50vh] overflow-auto rounded-lg bg-background/60 border border-border p-4 text-xs font-mono whitespace-pre-wrap text-foreground/90">
          {context}
        </pre>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={copy} className="gradient-bg border-0">
            {copied ? <Check className="size-4 mr-1.5" /> : <Copy className="size-4 mr-1.5" />}
            {copied ? "Copied" : "Copy to clipboard"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
