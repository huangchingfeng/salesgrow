import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  icon: LucideIcon;
  name: string;
  description: string;
  unlocked?: boolean;
  className?: string;
}

export function AchievementBadge({
  icon: Icon,
  name,
  description,
  unlocked = false,
  className,
}: AchievementBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-colors",
        unlocked
          ? "border-primary/30 bg-primary-light"
          : "border-border bg-bg-muted opacity-50",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          unlocked ? "bg-primary text-white" : "bg-border text-text-muted"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text truncate">{name}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
