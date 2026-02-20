import { create } from "zustand";

interface DailyTask {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  icon: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface GamificationState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  dailyTasks: DailyTask[];
  achievements: Achievement[];
  addXp: (amount: number) => void;
  completeTask: (taskId: string) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  unlockAchievement: (achievementId: string) => void;
}

const XP_PER_LEVEL = [0, 100, 300, 600, 1000, 1500];

function getLevelFromXp(totalXp: number): { level: number; currentXp: number; neededXp: number } {
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

export const useGamificationStore = create<GamificationState>((set) => ({
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  streak: 3,
  dailyTasks: [
    {
      id: "follow-up-1",
      title: "Follow up with a client",
      description: "Send a follow-up message to any client",
      xpReward: 20,
      completed: false,
      icon: "Bell",
    },
    {
      id: "research-1",
      title: "Research a new prospect",
      description: "Use AI to research a potential client",
      xpReward: 15,
      completed: false,
      icon: "Search",
    },
    {
      id: "practice-1",
      title: "Practice your pitch",
      description: "Complete a role-play session with AI Coach",
      xpReward: 25,
      completed: false,
      icon: "Brain",
    },
  ],
  achievements: [
    {
      id: "first-email",
      name: "First AI Email",
      description: "Send your first AI-generated email",
      icon: "Mail",
      unlocked: true,
      unlockedAt: "2026-02-15",
    },
    {
      id: "streak-7",
      name: "7-Day Streak",
      description: "Maintain a 7-day login streak",
      icon: "Flame",
      unlocked: false,
    },
    {
      id: "research-pro",
      name: "Research Pro",
      description: "Complete 50 client researches",
      icon: "Search",
      unlocked: false,
    },
  ],
  addXp: (amount) =>
    set((state) => {
      const totalXp = state.xp + amount;
      const { level, currentXp, neededXp } = getLevelFromXp(totalXp);
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
}));
