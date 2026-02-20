import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { clients } from '@/lib/db/schema';
import { eq, and, ilike, or, desc } from 'drizzle-orm';

const pipelineStages = [
  'lead', 'contacted', 'meeting', 'proposal',
  'negotiation', 'closed_won', 'closed_lost',
] as const;

export const clientRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        stage: z.enum(pipelineStages).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(clients.userId, ctx.user.id)];
      if (input?.stage) {
        filters.push(eq(clients.pipelineStage, input.stage));
      }

      return ctx.db
        .select()
        .from(clients)
        .where(and(...filters))
        .orderBy(desc(clients.updatedAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [client] = await ctx.db
        .select()
        .from(clients)
        .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)))
        .limit(1);
      return client ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1).max(255),
        website: z.string().url().optional(),
        industry: z.string().max(100).optional(),
        researchData: z.any().optional(),
        pipelineStage: z.enum(pipelineStages).default('lead'),
        dealValue: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(clients)
        .values({ ...input, userId: ctx.user.id })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        companyName: z.string().min(1).max(255).optional(),
        website: z.string().url().nullable().optional(),
        industry: z.string().max(100).nullable().optional(),
        researchData: z.any().optional(),
        pipelineStage: z.enum(pipelineStages).optional(),
        dealValue: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        lastContactAt: z.date().optional(),
        nextFollowUpAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(clients.id, id), eq(clients.userId, ctx.user.id)))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(clients)
        .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)));
      return { success: true };
    }),

  updatePipelineStage: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        stage: z.enum(pipelineStages),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(clients)
        .set({ pipelineStage: input.stage, updatedAt: new Date() })
        .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)))
        .returning();
      return updated;
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const pattern = `%${input.query}%`;
      return ctx.db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.userId, ctx.user.id),
            or(
              ilike(clients.companyName, pattern),
              ilike(clients.industry, pattern),
              ilike(clients.notes, pattern)
            )
          )
        )
        .orderBy(desc(clients.updatedAt))
        .limit(20);
    }),
});
