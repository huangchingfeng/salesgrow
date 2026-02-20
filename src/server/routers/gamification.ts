import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  users,
  achievements,
  leaderboardEntries,
  dailyTasks,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// 升級所需 XP（每一級增加 50）
function xpForLevel(level: number): number {
  return level * 100 + (level - 1) * 50;
}

const dailyTaskStatuses = ['pending', 'completed', 'skipped'] as const;

export const gamificationRouter = router({
  addXP: protectedProcedure
    .input(z.object({ amount: z.number().int().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const newXp = ctx.user.xp + input.amount;
      const [updated] = await ctx.db
        .update(users)
        .set({ xp: newXp, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),

  checkLevelUp: protectedProcedure.mutation(async ({ ctx }) => {
    let { level, xp } = ctx.user;
    let leveledUp = false;

    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level);
      level++;
      leveledUp = true;
    }

    if (leveledUp) {
      const [updated] = await ctx.db
        .update(users)
        .set({ level, xp, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return { leveledUp: true, newLevel: level, remainingXp: xp, user: updated };
    }

    return {
      leveledUp: false,
      currentLevel: level,
      currentXp: xp,
      xpNeeded: xpForLevel(level),
    };
  }),

  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, ctx.user.id))
      .orderBy(desc(achievements.earnedAt));
  }),

  unlockAchievement: protectedProcedure
    .input(z.object({ badgeId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      // 檢查是否已解鎖
      const [existing] = await ctx.db
        .select()
        .from(achievements)
        .where(
          and(
            eq(achievements.userId, ctx.user.id),
            eq(achievements.badgeId, input.badgeId)
          )
        )
        .limit(1);

      if (existing) {
        return { alreadyUnlocked: true, achievement: existing };
      }

      const [created] = await ctx.db
        .insert(achievements)
        .values({ userId: ctx.user.id, badgeId: input.badgeId })
        .returning();

      return { alreadyUnlocked: false, achievement: created };
    }),

  getLeaderboard: protectedProcedure
    .input(
      z.object({
        period: z.string().default('weekly'),
        limit: z.number().min(1).max(50).default(10),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(leaderboardEntries)
        .where(eq(leaderboardEntries.period, input?.period ?? 'weekly'))
        .orderBy(desc(leaderboardEntries.xpTotal))
        .limit(input?.limit ?? 10);
    }),

  getDailyTasks: protectedProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const targetDate = input?.date ?? new Date().toISOString().split('T')[0];
      return ctx.db
        .select()
        .from(dailyTasks)
        .where(
          and(
            eq(dailyTasks.userId, ctx.user.id),
            eq(dailyTasks.date, targetDate)
          )
        );
    }),

  completeDailyTask: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db
        .select()
        .from(dailyTasks)
        .where(
          and(
            eq(dailyTasks.id, input.id),
            eq(dailyTasks.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!task || task.status !== 'pending') {
        return { success: false, message: 'Task not found or already completed' };
      }

      // 標記完成
      const [updated] = await ctx.db
        .update(dailyTasks)
        .set({ status: 'completed' })
        .where(eq(dailyTasks.id, input.id))
        .returning();

      // 加 XP
      const newXp = ctx.user.xp + task.xpReward;
      await ctx.db
        .update(users)
        .set({ xp: newXp, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      return { success: true, task: updated, xpEarned: task.xpReward };
    }),
});
