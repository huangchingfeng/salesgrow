import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { users, salesProfiles } from '@/lib/db/schema';
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

  getSalesProfile: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select()
      .from(salesProfiles)
      .where(eq(salesProfiles.userId, ctx.user.id));
    return profile ?? null;
  }),

  updateSalesProfile: protectedProcedure
    .input(
      z.object({
        jobTitle: z.string().max(100).optional(),
        companyName: z.string().max(255).optional(),
        companyDescription: z.string().max(2000).optional(),
        productsServices: z.string().max(3000).optional(),
        industry: z.string().max(100).optional(),
        targetAudience: z.string().max(1000).optional(),
        uniqueSellingPoints: z.string().max(1000).optional(),
        yearsExperience: z.number().int().min(0).max(99).nullable().optional(),
        communicationStyle: z.string().max(50).optional(),
        personalBio: z.string().max(1000).optional(),
        phone: z.string().max(50).optional(),
        lineId: z.string().max(100).optional(),
        linkedinUrl: z.string().max(500).optional(),
        customLinks: z.array(z.object({
          label: z.string().max(50),
          url: z.string().max(500),
        })).max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: salesProfiles.id })
        .from(salesProfiles)
        .where(eq(salesProfiles.userId, ctx.user.id));

      if (existing) {
        const [updated] = await ctx.db
          .update(salesProfiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(salesProfiles.userId, ctx.user.id))
          .returning();
        return updated;
      } else {
        const [created] = await ctx.db
          .insert(salesProfiles)
          .values({ ...input, userId: ctx.user.id })
          .returning();
        return created;
      }
    }),
});
