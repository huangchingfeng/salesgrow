"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

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
  onMoveDeal?: (dealId: string, fromStageKey: string, toStageKey: string) => void;
}

export function PipelineBoard({ stages, className, onMoveDeal }: PipelineBoardProps) {
  const t = useTranslations("followUp");
  const [selectedDeal, setSelectedDeal] = useState<{ id: string; stageKey: string } | null>(null);

  const handleDealClick = (dealId: string, stageKey: string) => {
    if (selectedDeal?.id === dealId) {
      setSelectedDeal(null);
    } else {
      setSelectedDeal({ id: dealId, stageKey });
    }
  };

  const handleStageClick = (targetStageKey: string) => {
    if (selectedDeal && selectedDeal.stageKey !== targetStageKey && onMoveDeal) {
      onMoveDeal(selectedDeal.id, selectedDeal.stageKey, targetStageKey);
      setSelectedDeal(null);
    }
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-3 min-w-max pb-2">
        {stages.map((stage) => {
          const isDropTarget = selectedDeal && selectedDeal.stageKey !== stage.key;
          return (
            <div
              key={stage.key}
              className={cn(
                "w-56 shrink-0 rounded-lg p-1 transition-colors",
                isDropTarget && "ring-2 ring-primary/40 ring-dashed cursor-pointer bg-primary-light/30"
              )}
              onClick={() => isDropTarget && handleStageClick(stage.key)}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-sm font-semibold text-text">{stage.label}</h4>
                <Badge variant="secondary">{stage.deals.length}</Badge>
              </div>
              <div className="space-y-2">
                {stage.deals.map((deal) => {
                  const isSelected = selectedDeal?.id === deal.id;
                  return (
                    <Card
                      key={deal.id}
                      className={cn(
                        "cursor-pointer hover:shadow-md transition-all",
                        isSelected && "ring-2 ring-primary shadow-md"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDealClick(deal.id, stage.key);
                      }}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-text truncate">
                          {deal.clientName}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-semibold text-primary">
                            {deal.value}
                          </span>
                          <span className="text-xs text-text-muted">
                            {t("daysInStage", { days: deal.daysInStage })}
                          </span>
                        </div>
                        {isSelected && onMoveDeal && (
                          <p className="text-xs text-primary mt-1.5 flex items-center gap-0.5">
                            {t("clickToMove")} <ChevronRight className="h-3 w-3" />
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {stage.deals.length === 0 && (
                  <div className={cn(
                    "rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-muted",
                    isDropTarget && "border-primary text-primary"
                  )}>
                    {isDropTarget ? t("moveHere") : t("noDeals")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
