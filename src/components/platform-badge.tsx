import { cn } from "@/lib/utils";
import { getPlatformMeta } from "@/lib/platform";

export function PlatformBadge({
  platform,
  className,
}: {
  platform?: string | null;
  className?: string;
}) {
  const meta = getPlatformMeta(platform);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        meta.bg,
        meta.text,
        meta.ring,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
