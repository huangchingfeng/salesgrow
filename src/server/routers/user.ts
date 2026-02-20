import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        avatarUrl: z.string().url().optional(),
        locale: z.string().max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return {
      level: ctx.user.level,
      xp: ctx.user.xp,
      streakDays: ctx.user.streakDays,
      plan: ctx.user.plan,
      dailyAiCount: ctx.user.dailyAiCount,
    };
  }),

  updateStreak: protectedProcedure.mutation(async ({ ctx }) => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = ctx.user.streakLastDate;

    let newStreak = 1;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === today) {
        // 今天已更新
        return ctx.user;
      } else if (lastDate === yesterdayStr) {
        // 連續
        newStreak = ctx.user.streakDays + 1;
      }
      // 否則重置為 1
    }

    const [updated] = await ctx.db
      .update(users)
      .set({
        streakDays: newStreak,
        streakLastDate: today,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id))
      .returning();

    return updated;
  }),
});
