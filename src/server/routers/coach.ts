import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { coachSessions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const coachRouter = router({
  startSession: protectedProcedure
    .input(
      z.object({
        scenario: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .insert(coachSessions)
        .values({
          userId: ctx.user.id,
          scenario: input.scenario,
          conversation: [],
        })
        .returning();
      return session;
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 取得目前 session
      const [session] = await ctx.db
        .select()
        .from(coachSessions)
        .where(
          and(
            eq(coachSessions.id, input.sessionId),
            eq(coachSessions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!session) {
        throw new Error('Session not found');
      }

      const conversation = (session.conversation as Array<{ role: string; content: string }>) || [];
      conversation.push({ role: input.role, content: input.content });

      const [updated] = await ctx.db
        .update(coachSessions)
        .set({ conversation })
        .where(eq(coachSessions.id, input.sessionId))
        .returning();

      return updated;
    }),

  endSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        score: z.number().int().min(0).max(100).optional(),
        feedback: z.string().optional(),
        durationSeconds: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, ...data } = input;
      const [updated] = await ctx.db
        .update(coachSessions)
        .set(data)
        .where(
          and(
            eq(coachSessions.id, sessionId),
            eq(coachSessions.userId, ctx.user.id)
          )
        )
        .returning();
      return updated;
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(coachSessions)
        .where(eq(coachSessions.userId, ctx.user.id))
        .orderBy(desc(coachSessions.createdAt))
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);
    }),
});
