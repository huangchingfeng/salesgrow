"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PipelineDeal {
  id: string;
  clientName: string;
  value: string;
  daysInStage: number;
}

interface PipelineStage {
  key: string;
  label: string;
  deals: PipelineDeal[];
  color: string;
}

interface PipelineBoardProps {
  stages: PipelineStage[];
  className?: string;
}

export function PipelineBoard({ stages, className }: PipelineBoardProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-3 min-w-max pb-2">
        {stages.map((stage) => (
          <div key={stage.key} className="w-56 shrink-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h4 className="text-sm font-semibold text-text">{stage.label}</h4>
              <Badge variant="secondary">{stage.deals.length}</Badge>
            </div>
            <div className="space-y-2">
              {stage.deals.map((deal) => (
                <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-text truncate">
                      {deal.clientName}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs font-semibold text-primary">
                        {deal.value}
                      </span>
                      <span className="text-xs text-text-muted">
                        {deal.daysInStage}d
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {stage.deals.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
