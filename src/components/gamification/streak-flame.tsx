"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreakFlameProps {
  days: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { flame: "text-2xl", text: "text-xs" },
  md: { flame: "text-4xl", text: "text-sm" },
  lg: { flame: "text-6xl", text: "text-base" },
};

export function StreakFlame({ days, className, size = "md" }: StreakFlameProps) {
  const s = sizeMap[size];
  const isActive = days > 0;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <motion.div
        className={cn(s.flame, isActive ? "grayscale-0" : "grayscale opacity-40")}
        animate={
          isActive
            ? {
                scale: [1, 1.15, 1],
                rotate: [0, -5, 5, 0],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🔥
      </motion.div>
      <span
        className={cn(
          s.text,
          "font-bold",
          isActive ? "text-warning" : "text-text-muted"
        )}
      >
        {days}
      </span>
    </div>
  );
}
