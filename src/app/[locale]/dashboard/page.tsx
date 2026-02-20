"use client";

import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XpBar } from "@/components/gamification/xp-bar";
import { DailyTaskCard } from "@/components/modules/daily-task-card";
import { useGamificationStore } from "@/lib/stores/gamification-store";
import {
  Search,
  Mail,
  ClipboardList,
  Bell,
  Brain,
  Users,
  DollarSign,
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

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const gamT = useTranslations("gamification");
  const locale = useLocale();
  const { level, xp, xpToNextLevel, streak, dailyTasks, completeTask, addXp } =
    useGamificationStore();

  const levelTitles: Record<number, string> = {
    1: gamT("levels.1"),
    2: gamT("levels.2"),
    3: gamT("levels.3"),
    4: gamT("levels.4"),
    5: gamT("levels.5"),
  };

  const handleCompleteTask = (taskId: string, xpReward: number) => {
    completeTask(taskId);
    addXp(xpReward);
  };

  const pipelineStages = [
    { label: "Lead", count: 12, color: "bg-blue-500" },
    { label: "Contacted", count: 8, color: "bg-purple-500" },
    { label: "Meeting", count: 5, color: "bg-amber-500" },
    { label: "Proposal", count: 3, color: "bg-green-500" },
    { label: "Closed", count: 2, color: "bg-success" },
  ];

  const recentActivities = [
    { action: "Researched", target: "TechCorp Inc.", time: "2h ago", icon: Search },
    { action: "Sent email to", target: "Sarah Chen", time: "4h ago", icon: Mail },
    { action: "Logged visit with", target: "GlobalTrade", time: "Yesterday", icon: ClipboardList },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Greeting + Streak + XP */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">
              {t("greeting", { name: "Alex" })}
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
            {dailyTasks.map((task) => {
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
            })}
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
              <div className="space-y-3">
                {pipelineStages.map((stage) => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                    <span className="text-sm text-text flex-1">{stage.label}</span>
                    <Badge variant="secondary">{stage.count}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-text-secondary">
                  {t("deals", { count: 30 })}
                </p>
                <p className="text-sm font-medium text-success">
                  {t("revenue", { amount: "$125,000" })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
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
