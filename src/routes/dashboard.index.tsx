import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Brain, FolderKanban, Send, TrendingUp, Chrome, Sparkles, Copy, ArrowRight, X, Zap, Layers, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MemoryCard } from "@/components/memory-card";
import { ProjectCard } from "@/components/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();

  const stats = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [memCount, projCount, weekInj, todayMem] = await Promise.all([
        supabase.from("memories").select("id", { count: "exact", head: true }).eq("is_archived", false),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("context_injections").select("id", { count: "exact", head: true }).gte("injected_at", since.toISOString()),
        supabase.from("memories").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      ]);
      return {
        memories: memCount.count ?? 0,
        projects: projCount.count ?? 0,
        injectionsWeek: weekInj.count ?? 0,
        capturedToday: todayMem.count ?? 0,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["memories", "recent", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*, projects(name, color)")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const projects = useQuery({
    queryKey: ["projects", "active", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("is_active", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    { label: "Total Memories", value: stats.data?.memories ?? 0, icon: Brain },
    { label: "Active Projects", value: stats.data?.projects ?? 0, icon: FolderKanban },
    { label: "Injections this week", value: stats.data?.injectionsWeek ?? 0, icon: Send },
    { label: "Captured today", value: stats.data?.capturedToday ?? 0, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening in your context vault.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl glass p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 text-3xl font-bold gradient-text">{s.value}</div>
            </div>
          );
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent memories</h2>
          <Link to="/dashboard/memories" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recent.isLoading ? (
          <div className="grid md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : recent.data?.length ? (
          <div className="grid md:grid-cols-2 gap-3">
            {recent.data.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                projectName={m.projects?.name}
                projectColor={m.projects?.color ?? undefined}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl glass p-8 text-center text-sm text-muted-foreground">
            No memories yet. <Link to="/dashboard/capture" className="text-primary hover:underline">Capture your first one</Link>.
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Link to="/dashboard/projects" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {projects.isLoading ? (
          <div className="grid md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : projects.data?.length ? (
          <div className="grid md:grid-cols-3 gap-3">
            {projects.data.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <div className="rounded-xl glass p-8 text-center text-sm text-muted-foreground">
            No projects yet. <Link to="/dashboard/projects" className="text-primary hover:underline">Create one</Link>.
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent activity</h2>
        <div className="rounded-xl glass divide-y divide-white/5">
          {recent.data?.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 text-sm">
              <span className="truncate"><span className="text-muted-foreground">Captured</span> {m.title}</span>
              <span className="text-xs text-muted-foreground">{formatRelative(m.created_at)}</span>
            </div>
          )) ?? <div className="p-6 text-sm text-muted-foreground text-center">No activity yet.</div>}
        </div>
      </section>
    </div>
  );
}
