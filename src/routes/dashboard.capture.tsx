import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { analyzeMemory, type MemoryAnalysis } from "@/server/analyze.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/capture")({
  component: CapturePage,
});

function CapturePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const analyzeFn = useServerFn(analyzeMemory);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>("manual");
  const [projectId, setProjectId] = useState<string>("none");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [analysis, setAnalysis] = useState<MemoryAnalysis | null>(null);

  const projects = useQuery({
    queryKey: ["projects", "all", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name");
      return data ?? [];
    },
  });

  const analyzeMut = useMutation({
    mutationFn: async () => {
      const res = await analyzeFn({ data: { raw_content: content, title_hint: title } });
      if (res.error || !res.data) throw new Error(res.error ?? "Analysis failed");
      return res.data;
    },
    onSuccess: (data) => { setAnalysis(data); toast.success("Analysis ready"); },
    onError: (e: Error) => toast.error("Analysis failed", { description: e.message }),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const { data, error } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          title: title || content.slice(0, 80) || "Untitled",
          raw_content: content,
          source_platform: platform,
          capture_method: "manual",
          project_id: projectId === "none" ? null : projectId,
          tags: tagList,
          summary: analysis?.summary ?? null,
          key_points: analysis?.key_points ?? [],
          decisions: analysis?.decisions ?? [],
          open_questions: analysis?.open_questions ?? [],
          action_items: analysis?.action_items ?? [],
          relevance_score: analysis?.relevance_score ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Memory saved");
      qc.invalidateQueries({ queryKey: ["memories"] });
      navigate({ to: "/dashboard/memories/$id", params: { id: data.id } });
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Capture memory</h1>
        <p className="text-sm text-muted-foreground mt-1">Paste a conversation and let AI structure it.</p>
      </div>

      <div className="rounded-xl glass p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this about?" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Source platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="manual">Manual / Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Content</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} placeholder="Paste your conversation or write context here…" />
        </div>

        <div className="space-y-1.5">
          <Label>Tags (comma-separated)</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="auth, api, refactor" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            disabled={!content.trim() || analyzeMut.isPending}
            onClick={() => analyzeMut.mutate()}
            variant="outline"
          >
            <Sparkles className="size-4 mr-1.5" />
            {analyzeMut.isPending ? "Analyzing…" : "Analyze with AI"}
          </Button>
          <Button
            disabled={!content.trim() || saveMut.isPending}
            onClick={() => saveMut.mutate()}
            className="gradient-bg border-0 flex-1 min-w-[200px]"
          >
            {saveMut.isPending ? "Saving…" : analysis ? "Save with analysis" : "Save memory"}
          </Button>
        </div>
      </div>

      {analysis && (
        <div className="rounded-xl glass-strong p-5 border-l-4 border-primary space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> AI Analysis preview
          </h2>
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Summary</Label>
            <Textarea
              value={analysis.summary}
              onChange={(e) => setAnalysis({ ...analysis, summary: e.target.value })}
              rows={3}
            />
          </div>
          {(["key_points","decisions","open_questions","action_items"] as const).map((field) => (
            <div key={field}>
              <Label className="text-xs uppercase text-muted-foreground">{field.replace("_", " ")}</Label>
              <Textarea
                value={(analysis[field] ?? []).join("\n")}
                onChange={(e) => setAnalysis({ ...analysis, [field]: e.target.value.split("\n").filter(Boolean) })}
                rows={3}
                placeholder="One per line"
              />
            </div>
          ))}
          <div className="text-xs text-muted-foreground">
            Relevance score: <span className="text-foreground font-semibold">{Math.round(analysis.relevance_score)}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}
