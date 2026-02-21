"use client";

type PipelineStage =
  | "lead"
  | "contacted"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

const PIPELINE_STAGES: PipelineStage[] = [
  "lead",
  "contacted",
  "meeting",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

const STAGE_I18N_KEY: Record<PipelineStage, string> = {
  lead: "lead",
  contacted: "contacted",
  meeting: "meeting",
  proposal: "proposal",
  negotiation: "negotiation",
  closed_won: "closedWon",
  closed_lost: "closedLost",
};

interface StageFilterProps {
  activeStage: PipelineStage | "all";
  onStageChange: (stage: PipelineStage | "all") => void;
  stageCounts: Record<string, number>;
  translations: {
    all: string;
    stages: Record<string, string>;
  };
}

export function StageFilter({
  activeStage,
  onStageChange,
  stageCounts,
  translations,
}: StageFilterProps) {
  const activeClass =
    "rounded-full px-3 py-1.5 text-sm font-medium bg-primary text-white whitespace-nowrap";
  const inactiveClass =
    "rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary border border-border hover:text-text hover:bg-bg-muted transition-colors whitespace-nowrap";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        className={activeStage === "all" ? activeClass : inactiveClass}
        onClick={() => onStageChange("all")}
      >
        {translations.all}
        <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
          {stageCounts.all ?? 0}
        </span>
      </button>
      {PIPELINE_STAGES.map((stage) => (
        <button
          key={stage}
          className={activeStage === stage ? activeClass : inactiveClass}
          onClick={() => onStageChange(stage)}
        >
          {translations.stages[stage] ?? stage}
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
            {stageCounts[stage] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
