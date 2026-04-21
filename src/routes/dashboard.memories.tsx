import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Brain } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { MemoryCard } from "@/components/memory-card";
import { ContextInjectModal } from "@/components/context-inject-modal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatContextPack } from "@/lib/context-pack";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Memory = Database["public"]["Tables"]["memories"]["Row"];

export const Route = createFileRoute("/dashboard/memories")({
  component: MemoriesPage,
});

function MemoriesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [platform, setPlatform] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [injectMemory, setInjectMemory] = useState<Memory | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const projects = useQuery({
    queryKey: ["projects", "all", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name, color");
      if (error) throw error;
      return data;
    },
  });

  const memories = useQuery({
    queryKey: ["memories", { debounced, platform, projectFilter, sort }, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase.from("memories").select("*, projects(name, color)").eq("is_archived", false);
      if (platform !== "all") q = q.eq("source_platform", platform);
      if (projectFilter !== "all") q = q.eq("project_id", projectFilter);
      if (debounced) q = q.or(`title.ilike.%${debounced}%,summary.ilike.%${debounced}%`);
      const order = sort === "oldest" ? { col: "created_at", asc: true } :
                    sort === "relevance" ? { col: "relevance_score", asc: false } :
                    { col: "created_at", asc: false };
      q = q.order(order.col, { ascending: order.asc });
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  const archive = useMutation({
    mutationFn: async (m: Memory) => {
      const { error } = await supabase.from("memories").update({ is_archived: true }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Archived"); qc.invalidateQueries({ queryKey: ["memories"] }); },
  });

  const del = useMutation({
    mutationFn: async (m: Memory) => {
      const { error } = await supabase.from("memories").delete().eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["memories"] }); },
  });

  const injectContext = useMemo(() => injectMemory ? formatContextPack([injectMemory]) : "", [injectMemory]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Memories</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse, search, and inject your captured contexts.</p>
        </div>
        <Button asChild className="gradient-bg border-0"><Link to="/dashboard/capture">+ New capture</Link></Button>
      </div>

      <div className="rounded-xl glass p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9 bg-background/40" placeholder="Search title or summary…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            <SelectItem value="chatgpt">ChatGPT</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="relevance">Most relevant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {memories.isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : memories.data?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {memories.data.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              projectName={m.projects?.name}
              projectColor={m.projects?.color ?? undefined}
              onInject={setInjectMemory}
              onArchive={(mm) => archive.mutate(mm)}
              onDelete={(mm) => { if (confirm("Delete this memory?")) del.mutate(mm); }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl glass p-12 text-center">
          <Brain className="mx-auto size-10 text-primary mb-3" />
          <p className="text-muted-foreground">No memories match your filters.</p>
          <Button asChild className="mt-4 gradient-bg border-0"><Link to="/dashboard/capture">Capture your first memory</Link></Button>
        </div>
      )}

      <ContextInjectModal
        open={!!injectMemory}
        onOpenChange={(v) => !v && setInjectMemory(null)}
        context={injectContext}
        title={injectMemory?.title}
      />
    </div>
  );
}
