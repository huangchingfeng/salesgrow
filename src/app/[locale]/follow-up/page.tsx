"use client";

import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FollowUpCard } from "@/components/modules/follow-up-card";
import { PipelineBoard } from "@/components/modules/pipeline-board";
import { Bell, AlertTriangle, Calendar } from "lucide-react";

const MOCK_FOLLOW_UPS = {
  today: [
    {
      clientName: "Sarah Chen (TechCorp)",
      daysAgo: 3,
      suggestedMessage: "Hi Sarah, just wanted to follow up on our discussion about the CRM migration. Have you had a chance to review the proposal?",
      stage: "Proposal",
    },
    {
      clientName: "Michael Park (GlobalTrade)",
      daysAgo: 5,
      suggestedMessage: "Hi Michael, I hope you enjoyed the product demo. Would you like to schedule a technical deep-dive with your IT team?",
      stage: "Meeting",
    },
  ],
  overdue: [
    {
      clientName: "Lisa Wong (MediHealth)",
      daysAgo: 12,
      suggestedMessage: "Hi Lisa, it's been a while since we last connected. I'd love to hear about any updates on the budget approval process.",
      stage: "Negotiation",
    },
  ],
  upcoming: [
    {
      clientName: "David Kim (FinanceHub)",
      daysAgo: 1,
      suggestedMessage: "Hi David, looking forward to our call this week. Is there anything specific you'd like me to prepare?",
      stage: "Lead",
    },
  ],
};

const MOCK_PIPELINE = [
  {
    key: "lead",
    label: "Lead",
    color: "#3B82F6",
    deals: [
      { id: "1", clientName: "FinanceHub", value: "$15,000", daysInStage: 3 },
      { id: "2", clientName: "EduTech Co", value: "$8,000", daysInStage: 7 },
    ],
  },
  {
    key: "contacted",
    label: "Contacted",
    color: "#8B5CF6",
    deals: [
      { id: "3", clientName: "RetailMax", value: "$22,000", daysInStage: 5 },
    ],
  },
  {
    key: "meeting",
    label: "Meeting",
    color: "#F59E0B",
    deals: [
      { id: "4", clientName: "GlobalTrade", value: "$45,000", daysInStage: 2 },
    ],
  },
  {
    key: "proposal",
    label: "Proposal",
    color: "#22C55E",
    deals: [
      { id: "5", clientName: "TechCorp", value: "$60,000", daysInStage: 4 },
    ],
  },
  {
    key: "negotiation",
    label: "Negotiation",
    color: "#EC4899",
    deals: [
      { id: "6", clientName: "MediHealth", value: "$35,000", daysInStage: 10 },
    ],
  },
  {
    key: "closed",
    label: "Closed",
    color: "#10B981",
    deals: [],
  },
];

export default function FollowUpPage() {
  const t = useTranslations("followUp");

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("title")}</h1>

        {/* Follow-up tabs */}
        <Tabs defaultValue="today">
          <TabList>
            <Tab value="today">
              <span className="flex items-center gap-1.5">
                <Bell className="h-4 w-4" />
                {t("today")}
                <Badge variant="default">{MOCK_FOLLOW_UPS.today.length}</Badge>
              </span>
            </Tab>
            <Tab value="overdue">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {t("overdue")}
                <Badge variant="destructive">{MOCK_FOLLOW_UPS.overdue.length}</Badge>
              </span>
            </Tab>
            <Tab value="upcoming">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {t("upcoming")}
                <Badge variant="secondary">{MOCK_FOLLOW_UPS.upcoming.length}</Badge>
              </span>
            </Tab>
          </TabList>

          <TabPanel value="today">
            <div className="space-y-3">
              {MOCK_FOLLOW_UPS.today.map((item, i) => (
                <FollowUpCard key={i} {...item} />
              ))}
            </div>
          </TabPanel>

          <TabPanel value="overdue">
            <div className="space-y-3">
              {MOCK_FOLLOW_UPS.overdue.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-secondary">
                  {t("noOverdue")}
                </p>
              ) : (
                MOCK_FOLLOW_UPS.overdue.map((item, i) => (
                  <FollowUpCard key={i} {...item} />
                ))
              )}
            </div>
          </TabPanel>

          <TabPanel value="upcoming">
            <div className="space-y-3">
              {MOCK_FOLLOW_UPS.upcoming.map((item, i) => (
                <FollowUpCard key={i} {...item} />
              ))}
            </div>
          </TabPanel>
        </Tabs>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pipeline.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineBoard stages={MOCK_PIPELINE} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
