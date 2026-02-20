"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface XpBarProps {
  currentXp: number;
  neededXp: number;
  level: number;
  levelTitle: string;
  className?: string;
}

export function XpBar({ currentXp, neededXp, level, levelTitle, className }: XpBarProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold text-sm"
        key={level}
        initial={{ scale: 0.5, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {level}
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text truncate">{levelTitle}</span>
          <span className="text-xs text-text-secondary ml-2">
            {currentXp}/{neededXp} XP
          </span>
        </div>
        <Progress value={currentXp} max={neededXp} size="sm" barClassName="bg-primary" />
      </div>
    </div>
  );
}
