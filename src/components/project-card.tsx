import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Folder, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function ProjectCard({
  project,
  onSetActive,
}: {
  project: Project;
  onSetActive?: (p: Project) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="group relative rounded-xl glass p-4 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full ring-2 ring-white/10"
            style={{ backgroundColor: project.color ?? "#7c3aed" }}
          />
          <Link
            to="/dashboard/projects/$id"
            params={{ id: project.id }}
            className="font-semibold text-foreground hover:text-primary transition"
          >
            {project.name}
          </Link>
        </div>
        {project.is_active && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-primary"></span>
            </span>
            ACTIVE
          </span>
        )}
      </div>

      {project.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
      )}

      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {project.tech_stack.slice(0, 4).map((t) => (
            <span
              key={t}
              className="inline-flex rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground border border-white/10"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Folder className="size-3" /> {project.memory_count} memories
        </span>
        {!project.is_active && onSetActive && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => onSetActive(project)}
          >
            <Star className="size-3 mr-1" /> Set active
          </Button>
        )}
      </div>
    </motion.div>
  );
}
