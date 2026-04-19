import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Archive, Send, Trash2 } from "lucide-react";
import { PlatformBadge } from "./platform-badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type Memory = Database["public"]["Tables"]["memories"]["Row"];

interface Props {
  memory: Memory;
  projectColor?: string;
  projectName?: string;
  onInject?: (m: Memory) => void;
  onArchive?: (m: Memory) => void;
  onDelete?: (m: Memory) => void;
}

export function MemoryCard({ memory, projectColor, projectName, onInject, onArchive, onDelete }: Props) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.18 }}
      className="group relative rounded-xl glass p-4 hover:border-primary/30 hover:glow-violet-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <PlatformBadge platform={memory.source_platform} />
          {projectName && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: projectColor ?? "#7c3aed" }}
              />
              {projectName}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {formatRelative(memory.created_at)}
        </span>
      </div>

      <Link
        to="/dashboard/memories/$id"
        params={{ id: memory.id }}
        className="block mt-3"
      >
        <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition">
          {memory.title}
        </h3>
        {memory.summary && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{memory.summary}</p>
        )}
      </Link>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        {memory.key_points?.length ? <span>{memory.key_points.length} key points</span> : null}
        {memory.decisions?.length ? <span>{memory.decisions.length} decisions</span> : null}
      </div>

      <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {onInject && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onInject(memory)}>
            <Send className="size-3 mr-1" /> Inject
          </Button>
        )}
        {onArchive && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onArchive(memory)}>
            <Archive className="size-3 mr-1" /> Archive
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(memory)}
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
