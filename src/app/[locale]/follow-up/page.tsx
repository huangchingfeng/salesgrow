"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowUpCard } from "@/components/modules/follow-up-card";
import { PipelineBoard } from "@/components/modules/pipeline-board";
import { useUserStore } from "@/lib/stores/user-store";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/toast";
import { Bell, AlertTriangle, Calendar, Inbox } from "lucide-react";

// Pipeline stage metadata
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  lead: { label: "Lead", color: "#3B82F6" },
  contacted: { label: "Contacted", color: "#8B5CF6" },
  meeting: { label: "Meeting", color: "#F59E0B" },
  proposal: { label: "Proposal", color: "#22C55E" },
  negotiation: { label: "Negotiation", color: "#EC4899" },
  closed_won: { label: "Closed Won", color: "#10B981" },
  closed_lost: { label: "Closed Lost", color: "#6B7280" },
};

function daysBetween(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function FollowUpPage() {
  const t = useTranslations("followUp");
  const { toast } = useToast();
  const { isAuthenticated } = useUserStore();
  const utils = trpc.useUtils();

  // --- tRPC queries ---
  const todayQuery = trpc.followUp.listToday.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const overdueQuery = trpc.followUp.listOverdue.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const upcomingQuery = trpc.followUp.listUpcoming.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const clientsQuery = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // --- Mutations ---
  const markDone = trpc.followUp.markDone.useMutation({
    onSuccess: () => {
      toast("Follow-up completed!", "success");
      utils.followUp.listToday.invalidate();
      utils.followUp.listOverdue.invalidate();
      utils.followUp.listUpcoming.invalidate();
    },
    onError: (err) => {
      toast(err.message || "Failed to mark as done", "error");
    },
  });

  const snooze = trpc.followUp.snooze.useMutation({
    onSuccess: () => {
      toast("Snoozed for 3 days", "success");
      utils.followUp.listToday.invalidate();
      utils.followUp.listOverdue.invalidate();
      utils.followUp.listUpcoming.invalidate();
    },
    onError: (err) => {
      toast(err.message || "Failed to snooze", "error");
    },
  });

  const updatePipelineStage = trpc.clients.updatePipelineStage.useMutation({
    onSuccess: () => {
      toast("Pipeline stage updated!", "success");
      utils.clients.list.invalidate();
    },
    onError: (err) => {
      toast(err.message || "Failed to update stage", "error");
    },
  });

  // --- Client lookup map ---
  const clientMap = useMemo(() => {
    const map = new Map<string, { companyName: string; pipelineStage: string; dealValue: string | null }>();
    for (const c of clientsQuery.data ?? []) {
      map.set(c.id, {
        companyName: c.companyName,
        pipelineStage: c.pipelineStage,
        dealValue: c.dealValue,
      });
    }
    return map;
  }, [clientsQuery.data]);

  // --- Snooze handler (3 days from now) ---
  const handleSnooze = (id: string) => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    snooze.mutate({ id, newDueDate: future.toISOString().split("T")[0] });
  };

  // --- Pipeline stages from real client data ---
  const pipelineStages = useMemo(() => {
    const stageKeys = ["lead", "contacted", "meeting", "proposal", "negotiation", "closed_won", "closed_lost"];
    const grouped: Record<string, { id: string; clientName: string; value: string; daysInStage: number }[]> = {};
    for (const key of stageKeys) grouped[key] = [];

    for (const client of clientsQuery.data ?? []) {
      const stage = client.pipelineStage;
      if (grouped[stage]) {
        const daysInStage = client.updatedAt
          ? daysBetween(new Date(client.updatedAt).toISOString().split("T")[0])
          : 0;
        grouped[stage].push({
          id: client.id,
          clientName: client.companyName,
          value: client.dealValue ? `$${Number(client.dealValue).toLocaleString()}` : "$0",
          daysInStage,
        });
      }
    }

    return stageKeys.map((key) => ({
      key,
      label: STAGE_CONFIG[key]?.label ?? key,
      color: STAGE_CONFIG[key]?.color ?? "#999",
      deals: grouped[key],
    }));
  }, [clientsQuery.data]);

  const handleMoveDeal = (dealId: string, _fromStageKey: string, toStageKey: string) => {
    updatePipelineStage.mutate({ id: dealId, stage: toStageKey as "lead" | "contacted" | "meeting" | "proposal" | "negotiation" | "closed_won" | "closed_lost" });
  };

  // --- Render follow-up items ---
  const renderFollowUpList = (
    data: typeof todayQuery.data,
    isLoading: boolean,
    emptyMessage: string
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      );
    }
    if (!data?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Inbox className="h-10 w-10 text-text-muted mb-3" />
          <p className="text-sm text-text-secondary">{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {data.map((item) => {
          const client = clientMap.get(item.clientId);
          return (
            <FollowUpCard
              key={item.id}
              clientName={client?.companyName ?? "Unknown Client"}
              daysAgo={daysBetween(item.dueDate)}
              suggestedMessage={item.messageDraft ?? "No draft message available."}
              stage={STAGE_CONFIG[client?.pipelineStage ?? ""]?.label ?? "Unknown"}
              onMarkDone={() => markDone.mutate({ id: item.id })}
              onSnooze={() => handleSnooze(item.id)}
            />
          );
        })}
      </div>
    );
  };

  const isLoading = todayQuery.isLoading || overdueQuery.isLoading || upcomingQuery.isLoading;
  const todayCount = todayQuery.data?.length ?? 0;
  const overdueCount = overdueQuery.data?.length ?? 0;
  const upcomingCount = upcomingQuery.data?.length ?? 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        {!isAuthenticated && (
          <div className="rounded-lg border border-primary/30 bg-primary-light p-3 text-center text-sm text-primary">
            Demo data shown. Sign in to see your real follow-ups.
          </div>
        )}

        {/* Follow-up tabs */}
        <Tabs defaultValue="today">
          <TabList>
            <Tab value="today">
              <span className="flex items-center gap-1.5">
                <Bell className="h-4 w-4" />
                {t("today")}
                <Badge variant="default">{todayCount}</Badge>
              </span>
            </Tab>
            <Tab value="overdue">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {t("overdue")}
                <Badge variant="destructive">{overdueCount}</Badge>
              </span>
            </Tab>
            <Tab value="upcoming">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {t("upcoming")}
                <Badge variant="secondary">{upcomingCount}</Badge>
              </span>
            </Tab>
          </TabList>

          <TabPanel value="today">
            {renderFollowUpList(
              todayQuery.data,
              todayQuery.isLoading,
              "No follow-ups due today. You're all caught up!"
            )}
          </TabPanel>

          <TabPanel value="overdue">
            {renderFollowUpList(
              overdueQuery.data,
              overdueQuery.isLoading,
              t("noOverdue")
            )}
          </TabPanel>

          <TabPanel value="upcoming">
            {renderFollowUpList(
              upcomingQuery.data,
              upcomingQuery.isLoading,
              "No upcoming follow-ups in the next 7 days."
            )}
          </TabPanel>
        </Tabs>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pipeline.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {clientsQuery.isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : !clientsQuery.data?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-secondary">
                  No clients in your pipeline yet. Add clients from the Client Research page.
                </p>
              </div>
            ) : (
              <PipelineBoard stages={pipelineStages} onMoveDeal={handleMoveDeal} />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
