import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function QuickCaptureFab() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          title: title || content.slice(0, 80) || "Quick capture",
          raw_content: content,
          source_platform: "manual",
          capture_method: "manual",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["memories"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setTitle("");
      setContent("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error("Failed to save", { description: e.message }),
  });

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 size-14 rounded-full gradient-bg glow-violet flex items-center justify-center hover:scale-105 transition"
        aria-label="Quick capture"
      >
        {open ? <X className="size-6 text-white" /> : <Plus className="size-6 text-white" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-36 md:bottom-24 right-6 z-40 w-[92vw] max-w-md rounded-2xl glass-strong p-4 glow-violet-sm"
          >
            <h3 className="font-semibold mb-3">Quick capture</h3>
            <div className="space-y-2">
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Paste a conversation or write context here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/dashboard/capture" });
                }}
              >
                Full capture →
              </Button>
              <Button
                size="sm"
                disabled={!content.trim() || mutation.isPending}
                onClick={() => mutation.mutate()}
                className="gradient-bg border-0"
              >
                {mutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
