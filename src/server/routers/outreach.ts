import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { outreachEmails } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const emailStatuses = ['draft', 'sent', 'replied'] as const;

export const outreachRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        clientId: z.string().uuid().optional(),
        status: z.enum(emailStatuses).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const filters = [eq(outreachEmails.userId, ctx.user.id)];
      if (input?.clientId) {
        filters.push(eq(outreachEmails.clientId, input.clientId));
      }
      if (input?.status) {
        filters.push(eq(outreachEmails.status, input.status));
      }

      return ctx.db
        .select()
        .from(outreachEmails)
        .where(and(...filters))
        .orderBy(desc(outreachEmails.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [email] = await ctx.db
        .select()
        .from(outreachEmails)
        .where(
          and(eq(outreachEmails.id, input.id), eq(outreachEmails.userId, ctx.user.id))
        )
        .limit(1);
      return email ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string().uuid(),
        subject: z.string().min(1).max(500),
        body: z.string().min(1),
        language: z.string().max(10).optional(),
        tone: z.string().max(50).optional(),
        score: z.number().int().min(0).max(100).optional(),
        aiSuggestions: z.any().optional(),
        status: z.enum(emailStatuses).default('draft'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(outreachEmails)
        .values({ ...input, userId: ctx.user.id })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        subject: z.string().min(1).max(500).optional(),
        body: z.string().min(1).optional(),
        language: z.string().max(10).optional(),
        tone: z.string().max(50).optional(),
        score: z.number().int().min(0).max(100).optional(),
        aiSuggestions: z.any().optional(),
        status: z.enum(emailStatuses).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(outreachEmails)
        .set(data)
        .where(
          and(eq(outreachEmails.id, id), eq(outreachEmails.userId, ctx.user.id))
        )
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(outreachEmails)
        .where(
          and(eq(outreachEmails.id, input.id), eq(outreachEmails.userId, ctx.user.id))
        );
      return { success: true };
    }),
});
