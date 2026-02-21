import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { visitLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const clientMoods = ['positive', 'neutral', 'negative', 'interested', 'mixed'] as const;

export const visitLogRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(visitLogs)
        .where(eq(visitLogs.userId, ctx.user.id))
        .orderBy(desc(visitLogs.visitDate))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [log] = await ctx.db
        .select()
        .from(visitLogs)
        .where(
          and(eq(visitLogs.id, input.id), eq(visitLogs.userId, ctx.user.id))
        )
        .limit(1);
      return log ?? null;
    }),

  getByClient: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(visitLogs)
        .where(
          and(
            eq(visitLogs.userId, ctx.user.id),
            eq(visitLogs.clientId, input.clientId)
          )
        )
        .orderBy(desc(visitLogs.visitDate));
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        audioUrl: z.string().url().optional(),
        transcript: z.string().optional(),
        summary: z.string().optional(),
        nextSteps: z.array(z.string()).optional(),
        dealProbability: z.number().int().min(0).max(100).optional(),
        clientMood: z.enum(clientMoods).optional(),
        visitDate: z.string(), // YYYY-MM-DD
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(visitLogs)
        .values({ ...input, userId: ctx.user.id })
        .returning();
      return created;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(visitLogs)
        .where(
          and(eq(visitLogs.id, input.id), eq(visitLogs.userId, ctx.user.id))
        );
      return { success: true };
    }),
});
