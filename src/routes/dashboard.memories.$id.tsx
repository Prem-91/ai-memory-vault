import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Trash2, Archive, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformBadge } from "@/components/platform-badge";
import { ContextInjectModal } from "@/components/context-inject-modal";
import { formatContextPack, formatMemoryAsMarkdown } from "@/lib/context-pack";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/memories/$id")({
  component: MemoryDetailPage,
});

function MemoryDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [injectOpen, setInjectOpen] = useState(false);

  const memory = useQuery({
    queryKey: ["memory", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("memories").select("*, projects(*)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<{ title: string }>) => {
      const { error } = await supabase.from("memories").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["memory", id] }); qc.invalidateQueries({ queryKey: ["memories"] }); },
  });

  const archive = useMutation({
    mutationFn: async () => {
      await supabase.from("memories").update({ is_archived: true }).eq("id", id);
    },
    onSuccess: () => { toast.success("Archived"); navigate({ to: "/dashboard/memories" }); },
  });

  const del = useMutation({
    mutationFn: async () => { await supabase.from("memories").delete().eq("id", id); },
    onSuccess: () => { toast.success("Deleted"); navigate({ to: "/dashboard/memories" }); },
  });

  if (memory.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!memory.data) return <div className="text-center text-muted-foreground py-12">Memory not found.</div>;

  const m = memory.data;
  const contextPack = formatContextPack([m], m.projects);
  const markdown = formatMemoryAsMarkdown(m);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/dashboard/memories" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 mr-1" /> Back to memories
      </Link>

      <div className="rounded-xl glass-strong p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <PlatformBadge platform={m.source_platform} />
          <span className="text-[10px] uppercase rounded-full bg-white/5 text-muted-foreground px-2 py-0.5 ring-1 ring-white/10">
            {m.capture_method}
          </span>
          <span className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
        </div>

        {editingTitle ? (
          <div className="flex gap-2">
            <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} className="text-xl font-bold" />
            <Button size="sm" onClick={() => { update.mutate({ title: titleDraft }); setEditingTitle(false); }}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
          </div>
        ) : (
          <h1 className="text-2xl md:text-3xl font-bold cursor-pointer hover:text-primary transition" onClick={() => { setTitleDraft(m.title); setEditingTitle(true); }}>
            {m.title}
          </h1>
        )}

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setInjectOpen(true)} className="gradient-bg border-0"><Send className="size-3.5 mr-1.5" /> Inject</Button>
          <Button size="sm" variant="outline" onClick={() => archive.mutate()}><Archive className="size-3.5 mr-1.5" /> Archive</Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (confirm("Delete?")) del.mutate(); }}><Trash2 className="size-3.5 mr-1.5" /> Delete</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="context">Context Pack</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {m.summary && (
            <div className="rounded-xl glass p-5 border-l-4 border-primary">
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Summary</h3>
              <p className="text-sm">{m.summary}</p>
            </div>
          )}
          {m.key_points?.length > 0 && (
            <div className="rounded-xl glass p-5">
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Key Points</h3>
              <ul className="space-y-1.5 text-sm">
                {m.key_points.map((k, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{k}</li>)}
              </ul>
            </div>
          )}
          {m.raw_content && (
            <details className="rounded-xl glass p-5">
              <summary className="cursor-pointer text-xs uppercase text-muted-foreground">Raw content</summary>
              <pre className="mt-3 text-xs font-mono whitespace-pre-wrap bg-background/50 p-3 rounded-lg max-h-96 overflow-auto">{m.raw_content}</pre>
            </details>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 mt-4">
          <InsightSection title="Decisions Made" items={m.decisions} accent="text-primary" />
          <InsightSection title="Open Questions" items={m.open_questions} accent="text-amber-300" />
          <InsightSection title="Action Items" items={m.action_items} accent="text-cyan-300" checkable />
          <div className="rounded-xl glass p-5">
            <h3 className="text-xs uppercase text-muted-foreground mb-2">Relevance Score</h3>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full gradient-bg" style={{ width: `${Math.min(100, m.relevance_score)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{Math.round(m.relevance_score)}/100</p>
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-3 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => { navigator.clipboard.writeText(contextPack); toast.success("Copied"); }}>
              <Copy className="size-3.5 mr-1.5" /> Copy context
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadFile(JSON.stringify(m, null, 2), `${m.title}.json`, "application/json")}>
              Export JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadFile(markdown, `${m.title}.md`, "text/markdown")}>
              Export Markdown
            </Button>
          </div>
          <pre className="rounded-xl glass p-4 text-xs font-mono whitespace-pre-wrap max-h-[60vh] overflow-auto">{contextPack}</pre>
        </TabsContent>
      </Tabs>

      <ContextInjectModal open={injectOpen} onOpenChange={setInjectOpen} context={contextPack} title={m.title} />
    </div>
  );
}

function InsightSection({ title, items, accent, checkable }: { title: string; items: string[]; accent: string; checkable?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl glass p-5">
      <h3 className="text-xs uppercase text-muted-foreground mb-3">{title}</h3>
      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 items-start">
            {checkable ? <input type="checkbox" className="mt-1 accent-primary" /> : <span className={accent}>•</span>}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
