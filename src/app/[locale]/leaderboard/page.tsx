"use client";

import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { LeaderboardRow } from "@/components/gamification/leaderboard-row";
import { Trophy, Crown } from "lucide-react";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "Jessica Wang", xp: 4850, level: 5, levelTitle: "Sales Master" },
  { rank: 2, name: "Daniel Kim", xp: 4200, level: 4, levelTitle: "Sales Expert" },
  { rank: 3, name: "Emily Chen", xp: 3900, level: 4, levelTitle: "Sales Expert" },
  { rank: 4, name: "Ryan Park", xp: 3500, level: 4, levelTitle: "Sales Expert" },
  { rank: 5, name: "Alex (You)", xp: 3200, level: 3, levelTitle: "Sales Pro", isMe: true },
  { rank: 6, name: "Maria Lopez", xp: 2900, level: 3, levelTitle: "Sales Pro" },
  { rank: 7, name: "Tom Wilson", xp: 2600, level: 3, levelTitle: "Sales Pro" },
  { rank: 8, name: "Yuki Tanaka", xp: 2300, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 9, name: "Hans Mueller", xp: 2100, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 10, name: "Sophie Martin", xp: 1800, level: 2, levelTitle: "Sales Apprentice" },
];

export default function LeaderboardPage() {
  const t = useTranslations("gamification");

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t("leaderboard")}</h1>

        <Tabs defaultValue="weekly">
          <TabList>
            <Tab value="weekly">This Week</Tab>
            <Tab value="monthly">This Month</Tab>
            <Tab value="allTime">All Time</Tab>
          </TabList>

          {["weekly", "monthly", "allTime"].map((period) => (
            <TabPanel key={period} value={period}>
              {/* Top 3 podium */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {MOCK_LEADERBOARD.slice(0, 3).map((user, i) => {
                  const sizes = ["text-4xl", "text-3xl", "text-3xl"];
                  const heights = ["h-32", "h-24", "h-20"];
                  const orders = ["order-2", "order-1", "order-3"];
                  const colors = [
                    "from-yellow-400 to-amber-500",
                    "from-gray-300 to-gray-400",
                    "from-amber-600 to-amber-700",
                  ];
                  return (
                    <div
                      key={user.rank}
                      className={`flex flex-col items-center gap-2 ${orders[i]}`}
                    >
                      <div className="flex flex-col items-center">
                        {i === 0 && <Crown className="h-6 w-6 text-yellow-500 mb-1" />}
                        <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary">
                          {user.name.split(" ").map((w) => w[0]).join("")}
                        </div>
                        <p className="text-xs font-medium text-text mt-1 text-center truncate max-w-[80px]">
                          {user.name}
                        </p>
                        <p className="text-xs text-text-muted">{user.xp} XP</p>
                      </div>
                      <div
                        className={`w-full ${heights[i]} rounded-t-lg bg-gradient-to-b ${colors[i]} flex items-center justify-center text-white font-bold ${sizes[i]}`}
                      >
                        {user.rank}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full list */}
              <Card>
                <CardContent className="p-2">
                  {MOCK_LEADERBOARD.map((user) => (
                    <LeaderboardRow
                      key={user.rank}
                      {...user}
                      isMe={user.isMe || false}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabPanel>
          ))}
        </Tabs>

        {/* My rank highlight */}
        <Card className="border-primary/30 bg-primary-light">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-text">Your Rank</p>
                <p className="text-xs text-text-secondary">
                  {t("weeklyRank", { rank: 5 })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">3,200 XP</p>
              <p className="text-xs text-text-muted">300 XP to rank up</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
