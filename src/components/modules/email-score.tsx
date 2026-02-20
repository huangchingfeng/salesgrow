"use client";

import { ScoreRing } from "@/components/ui/score-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ScoreBreakdown {
  label: string;
  score: number;
}

interface EmailScoreProps {
  totalScore: number;
  breakdown: ScoreBreakdown[];
  suggestions: string[];
  className?: string;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  return "Needs Work";
}

export function EmailScore({
  totalScore,
  breakdown,
  suggestions,
  className,
}: EmailScoreProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Email Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ring Score */}
        <div className="flex justify-center">
          <ScoreRing score={totalScore} label={getScoreLabel(totalScore)} />
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text">{item.label}</span>
                <span className="text-sm font-medium text-text-secondary">{item.score}/100</span>
              </div>
              <Progress
                value={item.score}
                size="sm"
                barClassName={cn(
                  item.score >= 80
                    ? "bg-success"
                    : item.score >= 60
                    ? "bg-warning"
                    : "bg-danger"
                )}
              />
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text mb-2">Suggestions</h4>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-text-secondary"
                >
                  <span className="text-warning shrink-0">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
