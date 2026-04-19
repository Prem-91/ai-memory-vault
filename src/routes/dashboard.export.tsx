import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatContextPack, formatMemoryAsMarkdown } from "@/lib/context-pack";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/export")({
  component: ExportPage,
});

function ExportPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [project, setProject] = useState("all");
  const [format, setFormat] = useState<"json" | "markdown" | "plain" | "context">("context");

  const memories = useQuery({
    queryKey: ["memories", "export", user?.id, project],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase.from("memories").select("*, projects(*)").eq("is_archived", false);
      if (project !== "all") q = q.eq("project_id", project);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const projects = useQuery({
    queryKey: ["projects", "all", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("projects").select("id, name")).data ?? [],
  });

  const chosen = (memories.data ?? []).filter((m) => selected.size === 0 || selected.has(m.id));

  const renderContent = () => {
    if (format === "json") return JSON.stringify(chosen, null, 2);
    if (format === "markdown") return chosen.map(formatMemoryAsMarkdown).join("\n\n---\n\n");
    if (format === "plain") return chosen.map((m) => `${m.title}\n\n${m.summary ?? ""}\n\n${m.raw_content ?? ""}`).join("\n\n---\n\n");
    return formatContextPack(chosen);
  };
  const content = renderContent();

  const download = () => {
    const ext = format === "json" ? "json" : format === "markdown" ? "md" : "txt";
    const type = format === "json" ? "application/json" : "text/plain";
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `memories-export.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Export center</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick memories, choose a format, and download.</p>
      </div>

      <div className="rounded-xl glass p-4 flex flex-wrap gap-2 items-center">
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="context">Context Pack</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="plain">Plain text</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(content); toast.success("Copied"); }}>
            <Copy className="size-4 mr-1.5" /> Copy
          </Button>
          <Button onClick={download} className="gradient-bg border-0">
            <Download className="size-4 mr-1.5" /> Download
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl glass p-4">
          <h2 className="font-semibold mb-3">Memories ({chosen.length} of {memories.data?.length ?? 0})</h2>
          {memories.isLoading ? <Skeleton className="h-64" /> : (
            <div className="space-y-1.5 max-h-[60vh] overflow-auto">
              {memories.data?.map((m) => (
                <label key={m.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5 cursor-pointer text-sm">
                  <Checkbox
                    checked={selected.has(m.id)}
                    onCheckedChange={(v) => {
                      const next = new Set(selected);
                      if (v) next.add(m.id); else next.delete(m.id);
                      setSelected(next);
                    }}
                  />
                  <span className="truncate">{m.title}</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Select none to include all.</p>
        </div>
        <div className="rounded-xl glass p-4">
          <h2 className="font-semibold mb-3">Preview</h2>
          <pre className="text-xs font-mono whitespace-pre-wrap max-h-[60vh] overflow-auto bg-background/50 p-3 rounded-lg">
            {content.slice(0, 5000)}{content.length > 5000 ? "\n\n…" : ""}
          </pre>
        </div>
      </div>
    </div>
  );
}
