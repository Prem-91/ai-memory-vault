import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [extDetected, setExtDetected] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).__AI_MEMORY_VAULT_EXTENSION) setExtDetected(true);
  }, []);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => { if (profile.data) setDisplayName(profile.data.display_name ?? ""); }, [profile.data]);

  const update = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error("No user");
      const path = `${user.id}/avatar.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? null;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    },
    onSuccess: () => { toast.success("Avatar updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error("Upload failed", { description: e.message }),
  });

  const exportAll = async (format: "json" | "md") => {
    if (!user?.id) return;
    const { data } = await supabase.from("memories").select("*").eq("user_id", user.id);
    const content = format === "json" ? JSON.stringify(data, null, 2) :
      (data ?? []).map((m) => `# ${m.title}\n\n${m.summary ?? ""}\n\n${m.raw_content ?? ""}`).join("\n\n---\n\n");
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `memories.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Export ready");
  };

  const downloadExtension = () => {
    fetch("/ai-context-bridge-extension.zip")
      .then((r) => { if (!r.ok) throw new Error("Not available"); return r.blob(); })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "ai-context-bridge-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast.error("Extension not available yet"));
  };

  const deleteAll = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from("memories").delete().eq("user_id", user.id);
      await supabase.from("projects").delete().eq("user_id", user.id);
    },
    onSuccess: () => { toast.success("All data deleted"); qc.invalidateQueries(); },
  });

  if (profile.isLoading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>

      <Section title="Profile">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 ring-2 ring-primary/30">
            <AvatarImage src={profile.data?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">{(user?.email ?? "?")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <input id="avatar" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar.mutate(f); }} />
            <Button size="sm" variant="outline" onClick={() => document.getElementById("avatar")?.click()}>
              {uploadAvatar.isPending ? "Uploading…" : "Change avatar"}
            </Button>
          </div>
        </div>
        <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
        <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <Button onClick={() => update.mutate()} disabled={update.isPending} className="gradient-bg border-0">
          {update.isPending ? "Saving…" : "Save profile"}
        </Button>
      </Section>

      <Section title="Chrome Extension">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className={`size-2 rounded-full ${extDetected ? "bg-emerald-400" : "bg-muted-foreground"}`} />
            {extDetected ? "Extension connected" : "Extension not detected"}
          </div>
          <Button size="sm" variant="outline" onClick={downloadExtension}><Download className="size-3.5 mr-1.5" /> Download .zip</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Unzip → open chrome://extensions → enable Developer mode → Load unpacked → select the folder.
        </p>
      </Section>

      <Section title="Data Management">
        <div className="grid sm:grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => exportAll("json")}>Export all (JSON)</Button>
          <Button variant="outline" onClick={() => exportAll("md")}>Export all (Markdown)</Button>
        </div>
      </Section>

      <Section title="Plan">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-semibold uppercase">{profile.data?.plan ?? "free"}</span>
            <p className="text-sm mt-2">{profile.data?.memory_count ?? 0} / 50 memories used</p>
            <div className="mt-1 h-1.5 w-48 rounded-full bg-white/5"><div className="h-full gradient-bg rounded-full" style={{ width: `${Math.min(100, ((profile.data?.memory_count ?? 0) / 50) * 100)}%` }} /></div>
          </div>
          <Button className="gradient-bg border-0">Upgrade to Pro</Button>
        </div>
      </Section>

      <Section title="Danger Zone" danger>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="size-4" /> Delete all memories & projects</div>
          <Button variant="outline" className="border-destructive text-destructive" onClick={() => { if (confirm("This permanently deletes everything. Continue?")) deleteAll.mutate(); }}>
            Delete everything
          </Button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`rounded-xl glass p-5 space-y-4 ${danger ? "border-destructive/30" : ""}`}>
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}
