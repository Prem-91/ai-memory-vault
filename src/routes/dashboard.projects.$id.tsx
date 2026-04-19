import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/memory-card";
import { ContextInjectModal } from "@/components/context-inject-modal";
import { formatContextPack } from "@/lib/context-pack";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/projects/$id")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [injectOpen, setInjectOpen] = useState(false);

  const project = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const memories = useQuery({
    queryKey: ["memories", "by-project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("memories").select("*").eq("project_id", id).eq("is_archived", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => { if (project.data) setNotes(project.data.progress_notes ?? ""); }, [project.data]);

  const saveNotes = useMutation({
    mutationFn: async () => {
      await supabase.from("projects").update({ progress_notes: notes }).eq("id", id);
    },
    onSuccess: () => { toast.success("Notes saved"); qc.invalidateQueries({ queryKey: ["project", id] }); },
  });

  const del = useMutation({
    mutationFn: async () => { await supabase.from("projects").delete().eq("id", id); },
    onSuccess: () => { toast.success("Project deleted"); navigate({ to: "/dashboard/projects" }); },
  });

  if (project.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!project.data) return <div className="text-center text-muted-foreground py-12">Project not found.</div>;

  const p = project.data;
  const contextPack = formatContextPack(memories.data ?? [], p);

  return (
    <div className="space-y-6 max-w-7xl">
      <Link to="/dashboard/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 mr-1" /> Back to projects
      </Link>

      <div className="rounded-xl glass-strong p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="size-4 rounded-full ring-2 ring-white/10" style={{ backgroundColor: p.color ?? "#7c3aed" }} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{p.name}</h1>
            <p className="text-xs text-muted-foreground">{p.memory_count} memories • Created {formatDate(p.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setInjectOpen(true)} className="gradient-bg border-0">Generate Context Pack</Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (confirm("Delete project? Memories remain.")) del.mutate(); }}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold">Memories</h2>
          {memories.isLoading ? <Skeleton className="h-32 rounded-xl" /> :
           memories.data?.length ? (
            <div className="grid md:grid-cols-2 gap-3">
              {memories.data.map((m) => <MemoryCard key={m.id} memory={m} projectColor={p.color ?? undefined} projectName={p.name} />)}
            </div>
          ) : (
            <div className="rounded-xl glass p-8 text-center text-sm text-muted-foreground">
              No memories in this project. <Link to="/dashboard/capture" className="text-primary hover:underline">Capture one</Link>.
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {p.description && <div className="rounded-xl glass p-4"><h3 className="text-xs uppercase text-muted-foreground mb-1">Description</h3><p className="text-sm">{p.description}</p></div>}
          {p.goals && <div className="rounded-xl glass p-4"><h3 className="text-xs uppercase text-muted-foreground mb-1">Goals</h3><p className="text-sm">{p.goals}</p></div>}
          {p.tech_stack && p.tech_stack.length > 0 && (
            <div className="rounded-xl glass p-4">
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Tech stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {p.tech_stack.map((t) => <span key={t} className="text-xs bg-primary/15 text-primary rounded-md px-2 py-0.5">{t}</span>)}
              </div>
            </div>
          )}
          {p.constraints && <div className="rounded-xl glass p-4"><h3 className="text-xs uppercase text-muted-foreground mb-1">Constraints</h3><p className="text-sm">{p.constraints}</p></div>}
          <div className="rounded-xl glass p-4">
            <h3 className="text-xs uppercase text-muted-foreground mb-2">Progress notes</h3>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="What's the latest…" />
            <Button size="sm" onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending} className="mt-2 w-full">
              {saveNotes.isPending ? "Saving…" : "Save notes"}
            </Button>
          </div>
        </aside>
      </div>

      <ContextInjectModal open={injectOpen} onOpenChange={setInjectOpen} context={contextPack} title={`${p.name} — context pack`} />
    </div>
  );
}
