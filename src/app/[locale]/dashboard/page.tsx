"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XpBar } from "@/components/gamification/xp-bar";
import { DailyTaskCard } from "@/components/modules/daily-task-card";
import { useGamificationStore } from "@/lib/stores/gamification-store";
import { useUserStore } from "@/lib/stores/user-store";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/toast";
import {
  Search,
  Mail,
  ClipboardList,
  Bell,
  Brain,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

const iconMap: Record<string, any> = {
  Bell,
  Search,
  Brain,
  Mail,
  ClipboardList,
};

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "greetingMorning";
  if (hour >= 12 && hour < 18) return "greetingAfternoon";
  return "greetingEvening";
}

// 時間格式化
function timeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

const stageColorMap: Record<string, string> = {
  lead: "bg-blue-500",
  contacted: "bg-purple-500",
  meeting: "bg-amber-500",
  proposal: "bg-green-500",
  negotiation: "bg-orange-500",
  closed_won: "bg-success",
  closed_lost: "bg-destructive",
};

const stageLabelMap: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  meeting: "Meeting",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const gamT = useTranslations("gamification");
  const locale = useLocale();
  const { level, xp, xpToNextLevel, streak, dailyTasks, completeTask, addXp, initFromServer, initialized } =
    useGamificationStore();
  const { isAuthenticated, name } = useUserStore();
  const { toast } = useToast();

  const displayName = name || "Sales Pro";
  const greetingKey = getGreetingKey();

  const levelTitles: Record<number, string> = {
    1: gamT("levels.1"),
    2: gamT("levels.2"),
    3: gamT("levels.3"),
    4: gamT("levels.4"),
    5: gamT("levels.5"),
  };

  // --- tRPC Queries ---
  const clientsQuery = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const visitLogsQuery = trpc.visitLog.list.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  const outreachQuery = trpc.outreach.list.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  const statsQuery = trpc.user.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const dailyTasksQuery = trpc.gamification.getDailyTasks.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateStreakMutation = trpc.user.updateStreak.useMutation({
    onError: () => {
      toast("Failed to update streak.", "error");
    },
  });
  const completeDailyTaskMutation = trpc.gamification.completeDailyTask.useMutation({
    onError: () => {
      toast("Failed to save task completion.", "error");
    },
  });
  const addXpMutation = trpc.gamification.addXP.useMutation({
    onError: () => {
      toast("Failed to save XP.", "error");
    },
  });

  // --- Sync gamification store from server ---
  useEffect(() => {
    if (statsQuery.data && isAuthenticated) {
      const serverTasks = dailyTasksQuery.data;
      initFromServer(
        {
          level: statsQuery.data.level,
          xp: statsQuery.data.xp,
          streakDays: statsQuery.data.streakDays,
        },
        serverTasks?.length
          ? serverTasks.map((t) => ({
              id: t.id,
              taskType: t.taskType,
              description: t.description,
              xpReward: t.xpReward,
              status: t.status,
            }))
          : undefined
      );
    }
  }, [statsQuery.data, dailyTasksQuery.data, isAuthenticated]);

  // --- Update streak on mount ---
  useEffect(() => {
    if (isAuthenticated) {
      updateStreakMutation.mutate(undefined, {
        onSuccess: (data) => {
          if (data && "streakDays" in data && data.streakDays !== streak) {
            useGamificationStore.setState({ streak: data.streakDays });
          }
        },
      });
    }
  }, [isAuthenticated]);

  // --- Pipeline stats ---
  const pipelineStats = useMemo(() => {
    if (!clientsQuery.data) return null;
    const clients = clientsQuery.data;
    const stageCounts: Record<string, number> = {};
    let totalDealValue = 0;

    for (const client of clients) {
      const stage = client.pipelineStage;
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      if (client.dealValue) {
        totalDealValue += parseFloat(client.dealValue);
      }
    }

    const stages = ["lead", "contacted", "meeting", "proposal", "negotiation", "closed_won"].map(
      (stage) => ({
        key: stage,
        label: stageLabelMap[stage] || stage,
        count: stageCounts[stage] || 0,
        color: stageColorMap[stage] || "bg-gray-500",
      })
    );

    // 只顯示有資料的階段
    const activeStages = stages.filter((s) => s.count > 0);

    return {
      stages: activeStages.length > 0 ? activeStages : stages.slice(0, 5),
      totalDeals: clients.length,
      totalRevenue: totalDealValue,
    };
  }, [clientsQuery.data]);

  // --- Recent activity (合併多個來源) ---
  const recentActivities = useMemo(() => {
    const activities: { action: string; target: string; time: string; icon: any; date: Date }[] = [];

    // 拜訪紀錄
    if (visitLogsQuery.data) {
      for (const log of visitLogsQuery.data) {
        activities.push({
          action: "Logged visit",
          target: log.summary?.slice(0, 40) || "Client visit",
          time: timeAgo(log.visitDate || log.createdAt),
          icon: ClipboardList,
          date: new Date(log.visitDate || log.createdAt),
        });
      }
    }

    // 開發信
    if (outreachQuery.data) {
      for (const email of outreachQuery.data) {
        activities.push({
          action: email.status === "sent" ? "Sent email" : "Drafted email",
          target: email.subject?.slice(0, 40) || "Outreach email",
          time: timeAgo(email.createdAt),
          icon: Mail,
          date: new Date(email.createdAt),
        });
      }
    }

    // 按時間排序，取最近 5 筆
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    return activities.slice(0, 5);
  }, [visitLogsQuery.data, outreachQuery.data]);

  // --- Task completion handler ---
  const handleCompleteTask = (taskId: string, xpReward: number) => {
    // 即時更新本地 UI
    completeTask(taskId);
    addXp(xpReward);

    // 同步到 DB
    completeDailyTaskMutation.mutate({ id: taskId });
  };

  const isLoadingPipeline = isAuthenticated && clientsQuery.isLoading;
  const isLoadingActivity = isAuthenticated && (visitLogsQuery.isLoading || outreachQuery.isLoading);
  const isLoadingTasks = isAuthenticated && (statsQuery.isLoading || dailyTasksQuery.isLoading);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Login prompt for unauthenticated users */}
        {!isAuthenticated && (
          <div className="rounded-lg border border-primary/30 bg-primary-light p-3 text-center text-sm text-primary">
            {t("signInToSave") || "Sign in to save your progress"}
          </div>
        )}

        {/* Greeting + Streak + XP */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">
              {t(greetingKey, { name: displayName })}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {t("level", { level, title: levelTitles[level] || "Sales Rookie" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StreakFlame days={streak} size="sm" />
            <XpBar
              currentXp={xp % xpToNextLevel}
              neededXp={xpToNextLevel}
              level={level}
              levelTitle={levelTitles[level] || "Sales Rookie"}
              className="w-48"
            />
          </div>
        </div>

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("todayTasks")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingTasks ? (
              <>
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </>
            ) : dailyTasks.length > 0 ? (
              dailyTasks.map((task) => {
                const Icon = iconMap[task.icon] || Bell;
                return (
                  <DailyTaskCard
                    key={task.id}
                    icon={Icon}
                    title={task.title}
                    description={task.description}
                    xpReward={task.xpReward}
                    completed={task.completed}
                    onComplete={() => handleCompleteTask(task.id, task.xpReward)}
                  />
                );
              })
            ) : (
              <div className="py-6 text-center text-sm text-text-muted">
                {isAuthenticated
                  ? "No tasks for today. Check back tomorrow!"
                  : "Sign in to get personalized daily tasks."}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pipeline Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t("pipeline")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPipeline ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : pipelineStats && pipelineStats.totalDeals > 0 ? (
                <>
                  <div className="space-y-3">
                    {pipelineStats.stages.map((stage) => (
                      <div key={stage.key} className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                        <span className="text-sm text-text flex-1">{stage.label}</span>
                        <Badge variant="secondary">{stage.count}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-text-secondary">
                      {t("deals", { count: pipelineStats.totalDeals })}
                    </p>
                    {pipelineStats.totalRevenue > 0 && (
                      <p className="text-sm font-medium text-success">
                        {t("revenue", {
                          amount: `$${pipelineStats.totalRevenue.toLocaleString()}`,
                        })}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-sm text-text-muted">
                  {isAuthenticated
                    ? "Welcome! Start by researching your first potential client."
                    : "Sign in to track your sales pipeline."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t("recentActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity, i) => {
                    const Icon = activity.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-muted">
                          <Icon className="h-4 w-4 text-text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-text">
                            {activity.action}{" "}
                            <span className="font-medium">{activity.target}</span>
                          </p>
                          <p className="text-xs text-text-muted">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-text-muted">
                  {isAuthenticated
                    ? "Your activity feed will appear here as you use SalesGrow."
                    : "Sign in to see your recent activity."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Research", icon: Search, href: `/${locale}/research`, color: "bg-blue-50 dark:bg-blue-950 text-blue-600" },
            { label: "Write Email", icon: Mail, href: `/${locale}/outreach`, color: "bg-purple-50 dark:bg-purple-950 text-purple-600" },
            { label: "Log Visit", icon: ClipboardList, href: `/${locale}/visit-log`, color: "bg-red-50 dark:bg-red-950 text-red-600" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex flex-col items-center gap-2 p-4">
                    <div className={`rounded-lg p-2 ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-text">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
