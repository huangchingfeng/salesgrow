"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface DailyTaskCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  xpReward: number;
  completed?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function DailyTaskCard({
  icon: Icon,
  title,
  description,
  xpReward,
  completed = false,
  onComplete,
  className,
}: DailyTaskCardProps) {
  return (
    <Card
      className={cn(
        "transition-all",
        completed && "opacity-60",
        className
      )}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            completed ? "bg-success-light" : "bg-primary-light"
          )}
        >
          {completed ? (
            <Check className="h-5 w-5 text-success" />
          ) : (
            <Icon className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", completed ? "line-through text-text-muted" : "text-text")}>
            {title}
          </p>
          <p className="text-xs text-text-muted truncate">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Sparkles className="h-3 w-3" />
            +{xpReward} XP
          </Badge>
          {!completed && (
            <Button size="sm" variant="outline" onClick={onComplete}>
              Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
