import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface LeaderboardRowProps {
  rank: number;
  name: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  levelTitle: string;
  isMe?: boolean;
  className?: string;
}

const rankColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-600",
};

export function LeaderboardRow({
  rank,
  name,
  avatarUrl,
  xp,
  level,
  levelTitle,
  isMe = false,
  className,
}: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
        isMe ? "bg-primary-light border border-primary/30" : "hover:bg-bg-muted",
        className
      )}
    >
      {/* Rank */}
      <div className="flex h-8 w-8 items-center justify-center">
        {rank <= 3 ? (
          <Trophy className={cn("h-5 w-5", rankColors[rank])} />
        ) : (
          <span className="text-sm font-medium text-text-secondary">{rank}</span>
        )}
      </div>

      {/* Avatar + Name */}
      <Avatar src={avatarUrl} name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isMe ? "text-primary" : "text-text")}>
          {name}
        </p>
      </div>

      {/* XP */}
      <span className="text-sm font-semibold text-text tabular-nums">
        {xp.toLocaleString()} XP
      </span>

      {/* Level Badge */}
      <Badge variant={isMe ? "default" : "secondary"} className="hidden sm:inline-flex">
        Lv.{level}
      </Badge>
    </div>
  );
}
