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
  const [extDetected, setExtDetected] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).__AI_MEMORY_VAULT_EXTENSION) setExtDetected(true);
    if (typeof window !== "undefined" && localStorage.getItem("acb-guide-dismissed") === "1") setGuideDismissed(true);
  }, []);

  const dismissGuide = () => {
    localStorage.setItem("acb-guide-dismissed", "1");
    setGuideDismissed(true);
  };

  const downloadExtension = () => {
    fetch("/ai-context-bridge-extension.zip")
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "ai-context-bridge-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

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

      {!guideDismissed && (
        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-cyan-500/5 p-5 md:p-6 relative overflow-hidden">
          <button
            onClick={dismissGuide}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition"
            aria-label="Dismiss guide"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Getting Started</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Bridge context across every AI you use</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            AI Context Bridge captures your conversations from ChatGPT, Claude, and Gemini, then lets you inject that
            context back into any chat — so you never re-explain yourself again. Free, unlimited, forever.
          </p>

          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <FeatureTile icon={Layers} title="Capture anywhere" desc="Manually paste, use the Chrome extension, or right-click selections on any AI chat." />
            <FeatureTile icon={Zap} title="AI-powered analysis" desc="Gemini extracts summaries, decisions, action items, and open questions automatically." />
            <FeatureTile icon={Share2} title="Inject back instantly" desc="Build context packs from related memories and paste them into your next chat." />
          </div>

          <div className="rounded-xl bg-background/60 border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold">How to use it — 3 steps</h3>
            <ol className="space-y-2 text-sm">
              <Step n={1} title="Create a project" desc="Group memories by topic, client, or codebase.">
                <Link to="/dashboard/projects"><Button size="sm" variant="outline" className="h-7 text-xs">New project <ArrowRight className="size-3 ml-1" /></Button></Link>
              </Step>
              <Step n={2} title="Capture memories" desc="Paste a chat manually or install the extension to capture from ChatGPT, Claude, and Gemini.">
                <div className="flex flex-wrap gap-2">
                  <Link to="/dashboard/capture"><Button size="sm" variant="outline" className="h-7 text-xs"><Brain className="size-3 mr-1" /> Quick capture</Button></Link>
                  <Button size="sm" onClick={downloadExtension} className="h-7 text-xs gradient-bg border-0">
                    <Chrome className="size-3 mr-1" /> Get extension
                  </Button>
                  {extDetected && <span className="text-xs text-emerald-400 self-center">✓ Installed</span>}
                </div>
              </Step>
              <Step n={3} title="Inject context anywhere" desc="Open any memory, click 'Copy context pack', and paste into your next AI chat.">
                <Link to="/dashboard/memories"><Button size="sm" variant="outline" className="h-7 text-xs"><Copy className="size-3 mr-1" /> Browse memories</Button></Link>
              </Step>
            </ol>
          </div>
        </section>
      )}

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

function FeatureTile({ icon: Icon, title, desc }: { icon: typeof Brain; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border p-4">
      <Icon className="size-5 text-primary mb-2" />
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc, children }: { n: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-none size-6 rounded-full bg-primary/15 text-primary text-xs font-semibold grid place-items-center mt-0.5">{n}</span>
      <div className="flex-1 space-y-2">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        {children}
      </div>
    </li>
  );
}
