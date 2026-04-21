import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Brain, FolderKanban, Plus, Settings, Download, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QuickCaptureFab } from "@/components/quick-capture-fab";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayout,
});

const navItems: Array<{
  to: "/dashboard" | "/dashboard/memories" | "/dashboard/projects" | "/dashboard/capture" | "/dashboard/export" | "/dashboard/settings";
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  exact?: boolean;
}> = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/memories", label: "Memories", icon: Brain },
  { to: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { to: "/dashboard/capture", label: "Capture", icon: Plus },
  { to: "/dashboard/export", label: "Export", icon: Download },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const qc = useQueryClient();

  // Realtime subscription for new memories
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("memories-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memories", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const title = (payload.new as { title?: string })?.title ?? "New memory";
          toast.success("New memory captured", { description: title });
          qc.invalidateQueries({ queryKey: ["memories"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar/60 backdrop-blur-md fixed inset-y-0 left-0 z-30">
        <div className="p-4 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-primary/15 text-foreground glow-violet-sm border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar className="size-8 ring-1 ring-primary/30">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.email}</p>
              <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0 text-[9px] font-semibold uppercase text-primary">
                Free
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-sidebar/95 backdrop-blur-md">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md py-2 text-[10px] transition",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex-1 md:ml-60">
        <main className="min-h-screen p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <QuickCaptureFab />
    </div>
  );
}
