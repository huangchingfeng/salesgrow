"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { LeaderboardRow } from "@/components/gamification/leaderboard-row";
import { useUserStore } from "@/lib/stores/user-store";
import { trpc } from "@/lib/trpc";
import { getLevelFromXp } from "@/lib/stores/gamification-store";
import { Trophy, Crown, Loader2, Users } from "lucide-react";

// 從 level 推算 levelTitle
function getLevelTitle(level: number): string {
  if (level >= 5) return "Sales Master";
  if (level >= 4) return "Sales Expert";
  if (level >= 3) return "Sales Pro";
  if (level >= 2) return "Sales Apprentice";
  return "Sales Rookie";
}

interface DisplayEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  levelTitle: string;
  isMe?: boolean;
}

// tRPC period 值對照
const TAB_TO_PERIOD: Record<string, string> = {
  weekly: "weekly",
  monthly: "monthly",
  allTime: "all_time",
};

// Demo data 作為未登入時的 fallback
const DEMO_LEADERBOARD: DisplayEntry[] = [
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

export default function LeaderboardPage() {
  const t = useTranslations("gamification");
  const lt = useTranslations("leaderboard");
  const { isAuthenticated, id: myUserId } = useUserStore();
  const [activeTab, setActiveTab] = useState("weekly");

  // Fetch leaderboard data from DB
  const leaderboardQuery = trpc.gamification.getLeaderboard.useQuery(
    { period: TAB_TO_PERIOD[activeTab] ?? "weekly" },
    { enabled: isAuthenticated }
  );

  // Fetch current user stats
  const statsQuery = trpc.user.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Transform DB data to display entries
  const dbEntries: DisplayEntry[] = (leaderboardQuery.data ?? []).map((entry, idx) => ({
    rank: entry.rank ?? idx + 1,
    name: entry.userId === myUserId ? "You" : `User #${idx + 1}`,
    xp: entry.xpTotal,
    level: getLevelFromXp(entry.xpTotal).level,
    levelTitle: getLevelTitle(getLevelFromXp(entry.xpTotal).level),
    isMe: entry.userId === myUserId,
  }));

  // Use DB data if authenticated and available, else demo
  const useRealData = isAuthenticated && !leaderboardQuery.isLoading && dbEntries.length > 0;
  const currentData = useRealData ? dbEntries : DEMO_LEADERBOARD;

  // Inject real stats for "my" entry when using real data
  const myStats = statsQuery.data;
  const displayData = currentData.map((entry) => {
    if (entry.isMe && myStats) {
      return {
        ...entry,
        xp: myStats.xp,
        level: myStats.level,
        levelTitle: getLevelTitle(myStats.level),
      };
    }
    return entry;
  });

  const myEntry = displayData.find((e) => e.isMe);
  const nextRankEntry = myEntry ? displayData.find((e) => e.rank === myEntry.rank - 1) : null;
  const xpToRankUp = nextRankEntry && myEntry ? nextRankEntry.xp - myEntry.xp : 0;

  const isLoadingData = isAuthenticated && leaderboardQuery.isLoading;

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
              {isLoadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
                </div>
              ) : displayData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">
                    No leaderboard data yet. Complete tasks and practice to earn XP!
                  </p>
                </div>
              ) : (
                <>
                  {/* Top 3 podium */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {displayData.slice(0, 3).map((user, i) => {
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
                      {displayData.map((user) => (
                        <LeaderboardRow
                          key={user.rank}
                          {...user}
                          isMe={user.isMe || false}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
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
