import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const COLORS = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#3b82f6"];

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const projects = useQuery({
    queryKey: ["projects", "list", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects").select("*").order("is_active", { ascending: false }).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setActive = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) return;
      await supabase.from("projects").update({ is_active: false }).eq("user_id", user.id);
      await supabase.from("projects").update({ is_active: true }).eq("id", id);
    },
    onSuccess: () => { toast.success("Active project set"); qc.invalidateQueries({ queryKey: ["projects"] }); },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Group related memories under a project.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg border-0"><Plus className="size-4 mr-1" /> New project</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-primary/20 max-w-lg">
            <NewProjectForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {projects.isLoading ? (
        <div className="grid md:grid-cols-3 gap-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : projects.data?.length ? (
        <div className="grid md:grid-cols-3 gap-3">
          {projects.data.map((p) => (
            <ProjectCard key={p.id} project={p} onSetActive={(pp) => setActive.mutate(pp.id)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl glass p-12 text-center text-sm text-muted-foreground">
          No projects yet. Create your first one to organize memories.
        </div>
      )}
    </div>
  );
}

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState("");
  const [techInput, setTechInput] = useState("");
  const [tech, setTech] = useState<string[]>([]);
  const [constraints, setConstraints] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const create = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      const { error } = await supabase.from("projects").insert({
        user_id: user.id, name, description, goals, tech_stack: tech, constraints, color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project created");
      qc.invalidateQueries({ queryKey: ["projects"] });
      onDone();
    },
    onError: (e: Error) => toast.error("Failed", { description: e.message }),
  });

  const addTech = () => {
    const t = techInput.trim();
    if (t && !tech.includes(t)) setTech([...tech, t]);
    setTechInput("");
  };

  return (
    <>
      <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
      <div className="space-y-3 mt-2">
        <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
        <div><Label>Goals</Label><Textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} /></div>
        <div>
          <Label>Tech stack</Label>
          <div className="flex gap-2">
            <Input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
              placeholder="Press Enter to add"
            />
            <Button type="button" variant="outline" onClick={addTech}>Add</Button>
          </div>
          {tech.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tech.map((t) => (
                <button key={t} type="button" onClick={() => setTech(tech.filter((x) => x !== t))} className="rounded-md bg-primary/15 text-primary text-xs px-2 py-0.5 hover:bg-primary/25">
                  {t} ×
                </button>
              ))}
            </div>
          )}
        </div>
        <div><Label>Constraints</Label><Textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2} /></div>
        <div>
          <Label>Color</Label>
          <div className="flex gap-2 mt-1">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`size-7 rounded-full ring-2 transition ${color === c ? "ring-white scale-110" : "ring-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <Button disabled={!name || create.isPending} onClick={() => create.mutate()} className="w-full gradient-bg border-0">
          {create.isPending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </>
  );
}
