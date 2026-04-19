export type Platform = "chatgpt" | "claude" | "gemini" | "manual" | "selection";

export const PLATFORM_META: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  chatgpt: {
    label: "ChatGPT",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    ring: "ring-emerald-500/30",
  },
  claude: {
    label: "Claude",
    bg: "bg-orange-500/15",
    text: "text-orange-300",
    ring: "ring-orange-500/30",
  },
  gemini: {
    label: "Gemini",
    bg: "bg-blue-500/15",
    text: "text-blue-300",
    ring: "ring-blue-500/30",
  },
  manual: {
    label: "Manual",
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    ring: "ring-slate-500/30",
  },
  selection: {
    label: "Selection",
    bg: "bg-violet-500/15",
    text: "text-violet-300",
    ring: "ring-violet-500/30",
  },
};

export function getPlatformMeta(p?: string | null) {
  return PLATFORM_META[p ?? "manual"] ?? PLATFORM_META.manual;
}
