import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  icon: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface ServerStats {
  level: number;
  xp: number;
  streakDays: number;
}

interface ServerDailyTask {
  id: string;
  taskType: string;
  description: string;
  xpReward: number;
  status: string;
}

interface GamificationState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  dailyTasks: DailyTask[];
  achievements: Achievement[];
  initialized: boolean;
  addXp: (amount: number) => void;
  completeTask: (taskId: string) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  unlockAchievement: (achievementId: string) => void;
  initFromServer: (stats: ServerStats, tasks?: ServerDailyTask[], achievements?: Achievement[]) => void;
}

const XP_PER_LEVEL = [0, 100, 300, 600, 1000, 1500];

export function getLevelFromXp(totalXp: number): { level: number; currentXp: number; neededXp: number } {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (totalXp >= XP_PER_LEVEL[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  const prevThreshold = XP_PER_LEVEL[level - 1] || 0;
  const nextThreshold = XP_PER_LEVEL[level] || prevThreshold + 500;
  return {
    level,
    currentXp: totalXp - prevThreshold,
    neededXp: nextThreshold - prevThreshold,
  };
}

// 將 DB dailyTask 轉為本地格式
const taskTypeToIcon: Record<string, string> = {
  follow_up: "Bell",
  research: "Search",
  practice: "Brain",
  outreach: "Mail",
  visit: "ClipboardList",
};

function mapServerTask(t: ServerDailyTask): DailyTask {
  return {
    id: t.id,
    title: t.taskType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: t.description,
    xpReward: t.xpReward,
    completed: t.status === "completed",
    icon: taskTypeToIcon[t.taskType] || "Bell",
  };
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set) => ({
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  streak: 0,
  dailyTasks: [],
  achievements: [],
  initialized: false,

  initFromServer: (stats, tasks, serverAchievements) =>
    set(() => {
      const { level, neededXp } = getLevelFromXp(stats.xp);
      return {
        level,
        xp: stats.xp,
        xpToNextLevel: neededXp,
        streak: stats.streakDays,
        initialized: true,
        ...(tasks ? { dailyTasks: tasks.map(mapServerTask) } : {}),
        ...(serverAchievements ? { achievements: serverAchievements } : {}),
      };
    }),

  addXp: (amount) =>
    set((state) => {
      const totalXp = state.xp + amount;
      const { level, neededXp } = getLevelFromXp(totalXp);
      return { xp: totalXp, level, xpToNextLevel: neededXp };
    }),
  completeTask: (taskId) =>
    set((state) => ({
      dailyTasks: state.dailyTasks.map((task) =>
        task.id === taskId ? { ...task, completed: true } : task
      ),
    })),
  incrementStreak: () =>
    set((state) => ({ streak: state.streak + 1 })),
  resetStreak: () =>
    set({ streak: 0 }),
  unlockAchievement: (achievementId) =>
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.id === achievementId
          ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
          : a
      ),
    })),
    }),
    {
      name: "salesgrow-gamification",
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        xpToNextLevel: state.xpToNextLevel,
        streak: state.streak,
        achievements: state.achievements,
        initialized: state.initialized,
      }),
    }
  )
);
