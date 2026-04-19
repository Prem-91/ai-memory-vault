import type { Database } from "@/integrations/supabase/types";

type Memory = Database["public"]["Tables"]["memories"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

export function formatContextPack(memories: Memory[], project?: Project | null): string {
  const lines: string[] = [];
  lines.push("--- AI Memory Vault Context ---");
  if (project) lines.push(`Project: ${project.name}`);
  lines.push(`Captured: ${new Date().toLocaleString()}`);
  lines.push("");

  for (const m of memories) {
    lines.push(`### ${m.title}`);
    if (m.summary) {
      lines.push("");
      lines.push("SUMMARY:");
      lines.push(m.summary);
    }
    if (m.key_points?.length) {
      lines.push("");
      lines.push("KEY CONTEXT:");
      m.key_points.forEach((k) => lines.push(`- ${k}`));
    }
    if (m.decisions?.length) {
      lines.push("");
      lines.push("DECISIONS MADE:");
      m.decisions.forEach((d) => lines.push(`- ${d}`));
    }
    if (m.open_questions?.length) {
      lines.push("");
      lines.push("OPEN QUESTIONS:");
      m.open_questions.forEach((q) => lines.push(`- ${q}`));
    }
    if (m.action_items?.length) {
      lines.push("");
      lines.push("ACTION ITEMS:");
      m.action_items.forEach((a) => lines.push(`- ${a}`));
    }
    lines.push("");
  }

  lines.push("--- End Context ---");
  return lines.join("\n");
}

export function formatMemoryAsMarkdown(m: Memory): string {
  const lines: string[] = [];
  lines.push(`# ${m.title}`);
  lines.push("");
  lines.push(`**Source:** ${m.source_platform}  |  **Captured:** ${new Date(m.created_at).toLocaleString()}`);
  if (m.summary) {
    lines.push("");
    lines.push("## Summary");
    lines.push(m.summary);
  }
  if (m.key_points?.length) {
    lines.push("");
    lines.push("## Key Points");
    m.key_points.forEach((k) => lines.push(`- ${k}`));
  }
  if (m.decisions?.length) {
    lines.push("");
    lines.push("## Decisions");
    m.decisions.forEach((d) => lines.push(`- ${d}`));
  }
  if (m.open_questions?.length) {
    lines.push("");
    lines.push("## Open Questions");
    m.open_questions.forEach((q) => lines.push(`- ${q}`));
  }
  if (m.action_items?.length) {
    lines.push("");
    lines.push("## Action Items");
    m.action_items.forEach((a) => lines.push(`- [ ] ${a}`));
  }
  if (m.raw_content) {
    lines.push("");
    lines.push("## Raw Content");
    lines.push("```");
    lines.push(m.raw_content);
    lines.push("```");
  }
  return lines.join("\n");
}
