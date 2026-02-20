"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SkillData {
  label: string;
  value: number;
}

interface LevelCardProps {
  level: number;
  title: string;
  skills: SkillData[];
  className?: string;
}

export function LevelCard({ level, title, skills, className }: LevelCardProps) {
  const maxSkills = 5;
  const angleStep = (2 * Math.PI) / skills.length;
  const size = 160;
  const center = size / 2;
  const radius = 55;

  const points = skills.map((skill, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (skill.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (radius + 18) * Math.cos(angle),
      labelY: center + (radius + 18) * Math.sin(angle),
      label: skill.label,
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold">
            {level}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-text">{title}</h3>
        </div>

        <svg width={size} height={size} className="mx-auto">
          {/* Grid lines */}
          {[20, 40, 60, 80, 100].map((pct) => {
            const gridPoints = skills
              .map((_, i) => {
                const angle = angleStep * i - Math.PI / 2;
                const r = (pct / 100) * radius;
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
              })
              .join(" ");
            return (
              <polygon
                key={pct}
                points={gridPoints}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="0.5"
              />
            );
          })}
          {/* Axes */}
          {skills.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="var(--color-border)"
                strokeWidth="0.5"
              />
            );
          })}
          {/* Data polygon */}
          <polygon
            points={polygonPoints}
            fill="var(--color-primary)"
            fillOpacity="0.2"
            stroke="var(--color-primary)"
            strokeWidth="2"
          />
          {/* Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.labelX}
              y={p.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-text-secondary text-[9px]"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}
