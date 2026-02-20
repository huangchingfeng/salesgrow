"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { LeaderboardRow } from "@/components/gamification/leaderboard-row";
import { useUserStore } from "@/lib/stores/user-store";
import { useGamificationStore } from "@/lib/stores/gamification-store";
import { Trophy, Crown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  levelTitle: string;
  isMe?: boolean;
}

// TODO: fetch from DB via tRPC when authenticated
const DEMO_LEADERBOARD_WEEKLY: LeaderboardEntry[] = [
  { rank: 1, name: "Jessica Wang", xp: 1250, level: 5, levelTitle: "Sales Master" },
  { rank: 2, name: "Daniel Kim", xp: 1100, level: 4, levelTitle: "Sales Expert" },
  { rank: 3, name: "Emily Chen", xp: 980, level: 4, levelTitle: "Sales Expert" },
  { rank: 4, name: "Ryan Park", xp: 870, level: 4, levelTitle: "Sales Expert" },
  { rank: 5, name: "You", xp: 750, level: 3, levelTitle: "Sales Pro", isMe: true },
  { rank: 6, name: "Maria Lopez", xp: 680, level: 3, levelTitle: "Sales Pro" },
  { rank: 7, name: "Tom Wilson", xp: 610, level: 3, levelTitle: "Sales Pro" },
  { rank: 8, name: "Yuki Tanaka", xp: 540, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 9, name: "Hans Mueller", xp: 480, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 10, name: "Sophie Martin", xp: 420, level: 2, levelTitle: "Sales Apprentice" },
];

const DEMO_LEADERBOARD_MONTHLY: LeaderboardEntry[] = [
  { rank: 1, name: "Daniel Kim", xp: 4200, level: 4, levelTitle: "Sales Expert" },
  { rank: 2, name: "Jessica Wang", xp: 4100, level: 5, levelTitle: "Sales Master" },
  { rank: 3, name: "Ryan Park", xp: 3800, level: 4, levelTitle: "Sales Expert" },
  { rank: 4, name: "Emily Chen", xp: 3500, level: 4, levelTitle: "Sales Expert" },
  { rank: 5, name: "Maria Lopez", xp: 3200, level: 3, levelTitle: "Sales Pro" },
  { rank: 6, name: "You", xp: 2900, level: 3, levelTitle: "Sales Pro", isMe: true },
  { rank: 7, name: "Tom Wilson", xp: 2600, level: 3, levelTitle: "Sales Pro" },
  { rank: 8, name: "Yuki Tanaka", xp: 2300, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 9, name: "Hans Mueller", xp: 2100, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 10, name: "Sophie Martin", xp: 1800, level: 2, levelTitle: "Sales Apprentice" },
];

const DEMO_LEADERBOARD_ALL_TIME: LeaderboardEntry[] = [
  { rank: 1, name: "Jessica Wang", xp: 14850, level: 5, levelTitle: "Sales Master" },
  { rank: 2, name: "Daniel Kim", xp: 12200, level: 4, levelTitle: "Sales Expert" },
  { rank: 3, name: "Emily Chen", xp: 10900, level: 4, levelTitle: "Sales Expert" },
  { rank: 4, name: "Ryan Park", xp: 9500, level: 4, levelTitle: "Sales Expert" },
  { rank: 5, name: "Maria Lopez", xp: 8200, level: 3, levelTitle: "Sales Pro" },
  { rank: 6, name: "Tom Wilson", xp: 7600, level: 3, levelTitle: "Sales Pro" },
  { rank: 7, name: "You", xp: 6800, level: 3, levelTitle: "Sales Pro", isMe: true },
  { rank: 8, name: "Yuki Tanaka", xp: 5300, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 9, name: "Hans Mueller", xp: 4100, level: 2, levelTitle: "Sales Apprentice" },
  { rank: 10, name: "Sophie Martin", xp: 3800, level: 2, levelTitle: "Sales Apprentice" },
];

const DEMO_DATA: Record<string, LeaderboardEntry[]> = {
  weekly: DEMO_LEADERBOARD_WEEKLY,
  monthly: DEMO_LEADERBOARD_MONTHLY,
  allTime: DEMO_LEADERBOARD_ALL_TIME,
};

export default function LeaderboardPage() {
  const t = useTranslations("gamification");
  const lt = useTranslations("leaderboard");
  const { isAuthenticated, name } = useUserStore();
  const { xp: myXp, level: myLevel } = useGamificationStore();
  const [activeTab, setActiveTab] = useState("weekly");

  const currentData = DEMO_DATA[activeTab].map((entry) => {
    if (entry.isMe && isAuthenticated && name) {
      return { ...entry, name: `${name} (You)`, xp: myXp || entry.xp, level: myLevel || entry.level };
    }
    return entry;
  });

  const myEntry = currentData.find((e) => e.isMe);
  const nextRankEntry = myEntry ? currentData.find((e) => e.rank === myEntry.rank - 1) : null;
  const xpToRankUp = nextRankEntry && myEntry ? nextRankEntry.xp - myEntry.xp : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{lt("title")}</h1>

        {!isAuthenticated && (
          <div className="rounded-lg border border-primary/30 bg-primary-light p-3 text-center text-sm text-primary">
            Demo data shown. Sign in to see your real ranking.
          </div>
        )}

        <Tabs defaultValue="weekly" onChange={setActiveTab}>
          <TabList>
            <Tab value="weekly">{lt("tabs.weekly")}</Tab>
            <Tab value="monthly">{lt("tabs.monthly")}</Tab>
            <Tab value="allTime">{lt("tabs.allTime")}</Tab>
          </TabList>

          {["weekly", "monthly", "allTime"].map((period) => (
            <TabPanel key={period} value={period}>
              {/* Top 3 podium */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(DEMO_DATA[period] || []).slice(0, 3).map((user, i) => {
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
                        <p className="text-xs text-text-muted">{user.xp.toLocaleString()} XP</p>
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
                  {(DEMO_DATA[period] || []).map((user) => (
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
        {myEntry && (
          <Card className="border-primary/30 bg-primary-light">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-text">{lt("yourRank")}</p>
                  <p className="text-xs text-text-secondary">
                    {lt("rank", { rank: myEntry.rank })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{myEntry.xp.toLocaleString()} XP</p>
                {xpToRankUp > 0 && (
                  <p className="text-xs text-text-muted">
                    {lt("xpToRankUp", { xp: xpToRankUp.toLocaleString() })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
