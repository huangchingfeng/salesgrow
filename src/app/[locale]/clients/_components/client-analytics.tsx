"use client";

import { useMemo } from "react";
import { Users, DollarSign, TrendingUp, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ClientAnalyticsProps {
  clients: Array<{
    id: string;
    companyName: string;
    industry: string | null;
    pipelineStage: string;
    dealValue: string | null;
    lastContactAt: string | Date | null;
  }>;
  locale: string;
  translations: {
    totalClients: string;
    totalDealValue: string;
    winRate: string;
    avgDealValue: string;
    pipelineChart: string;
    dealDistribution: string;
    stages: Record<string, string>;
  };
}

const PIPELINE_STAGES = [
  "lead",
  "contacted",
  "meeting",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

const STAGE_COLORS: Record<string, string> = {
  lead: "#94a3b8",
  contacted: "#60a5fa",
  meeting: "#f59e0b",
  proposal: "#818cf8",
  negotiation: "#fb923c",
  closed_won: "#34d399",
  closed_lost: "#f87171",
};

export function ClientAnalytics({
  clients,
  locale,
  translations,
}: ClientAnalyticsProps) {
  const metrics = useMemo(() => {
    const total = clients.length;
    const totalDeal = clients.reduce(
      (sum, c) => sum + (Number(c.dealValue) || 0),
      0
    );
    const wonCount = clients.filter(
      (c) => c.pipelineStage === "closed_won"
    ).length;
    const closedCount = clients.filter(
      (c) =>
        c.pipelineStage === "closed_won" || c.pipelineStage === "closed_lost"
    ).length;
    const winRate =
      closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
    const avgDeal = total > 0 ? Math.round(totalDeal / total) : 0;
    return { total, totalDeal, winRate, avgDeal };
  }, [clients]);

  const formatCurrency = (num: number) => {
    if (num === 0) return "-";
    return new Intl.NumberFormat(
      locale === "zh-TW" ? "zh-TW" : locale === "ja" ? "ja-JP" : "en-US",
      {
        style: "currency",
        currency:
          locale === "zh-TW" ? "TWD" : locale === "ja" ? "JPY" : "USD",
        maximumFractionDigits: 0,
      }
    ).format(num);
  };

  const pipelineData = useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => ({
        stage: translations.stages[stage] || stage,
        count: clients.filter((c) => c.pipelineStage === stage).length,
        fill: STAGE_COLORS[stage],
      })),
    [clients, translations.stages]
  );

  const dealData = useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => ({
        name: translations.stages[stage] || stage,
        value: clients
          .filter((c) => c.pipelineStage === stage)
          .reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0),
        fill: STAGE_COLORS[stage],
      })).filter((d) => d.value > 0),
    [clients, translations.stages]
  );

  const metricCards = [
    { label: translations.totalClients, value: metrics.total, icon: Users },
    {
      label: translations.totalDealValue,
      value: formatCurrency(metrics.totalDeal),
      icon: DollarSign,
    },
    {
      label: translations.winRate,
      value: `${metrics.winRate}%`,
      icon: TrendingUp,
    },
    {
      label: translations.avgDealValue,
      value: formatCurrency(metrics.avgDeal),
      icon: Target,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-bg-card p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-text-secondary">
              <item.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            <p className="text-2xl font-bold text-text">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline bar chart */}
        <div className="rounded-xl border border-border bg-bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text">
            {translations.pipelineChart}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-text-secondary)"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-text-secondary)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deal distribution pie chart */}
        <div className="rounded-xl border border-border bg-bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text">
            {translations.dealDistribution}
          </h3>
          <div className="h-64">
            {dealData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">
                No deal data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dealData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dealData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "var(--color-bg-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
