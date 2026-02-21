import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { followUps } from '@/lib/db/schema';
import { eq, and, lte, gte, gt, lt, desc } from 'drizzle-orm';

const priorities = ['high', 'medium', 'low'] as const;

export const followUpRouter = router({
  listToday: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split('T')[0];
    return ctx.db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.userId, ctx.user.id),
          eq(followUps.dueDate, today),
          eq(followUps.status, 'pending')
        )
      )
      .orderBy(desc(followUps.priority));
  }),

  listOverdue: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split('T')[0];
    return ctx.db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.userId, ctx.user.id),
          lt(followUps.dueDate, today),
          eq(followUps.status, 'pending')
        )
      )
      .orderBy(followUps.dueDate);
  }),

  listUpcoming: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(30).default(7) }).optional())
    .query(async ({ ctx, input }) => {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (input?.days ?? 7));
      const futureStr = futureDate.toISOString().split('T')[0];

      // gt (not gte) to avoid overlap with listToday
      return ctx.db
        .select()
        .from(followUps)
        .where(
          and(
            eq(followUps.userId, ctx.user.id),
            gt(followUps.dueDate, today),
            lte(followUps.dueDate, futureStr),
            eq(followUps.status, 'pending')
          )
        )
        .orderBy(followUps.dueDate);
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        dueDate: z.string(), // YYYY-MM-DD
        messageDraft: z.string().optional(),
        priority: z.enum(priorities).default('medium'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(followUps)
        .values({ ...input, userId: ctx.user.id })
        .returning();
      return created;
    }),

  markDone: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(followUps)
        .set({ status: 'done' })
        .where(
          and(eq(followUps.id, input.id), eq(followUps.userId, ctx.user.id))
        )
        .returning();
      return updated;
    }),

  snooze: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        newDueDate: z.string(), // YYYY-MM-DD
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Keep status as 'pending' so it reappears on the new due date
      const [updated] = await ctx.db
        .update(followUps)
        .set({ dueDate: input.newDueDate })
        .where(
          and(eq(followUps.id, input.id), eq(followUps.userId, ctx.user.id))
        )
        .returning();
      return updated;
    }),
});
