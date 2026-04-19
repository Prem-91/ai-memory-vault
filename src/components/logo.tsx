import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 group", className)}>
      <span className="relative inline-flex size-8 items-center justify-center rounded-lg gradient-bg glow-violet-sm group-hover:scale-105 transition">
        <Sparkles className="size-4 text-white" strokeWidth={2.5} />
      </span>
      {withText && (
        <span className="font-bold text-foreground tracking-tight">
          AI <span className="gradient-text">Context Bridge</span>
        </span>
      )}
    </Link>
  );
}
