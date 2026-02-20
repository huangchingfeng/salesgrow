import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/db/schema';
import { db } from '@/lib/db';

export type Context = {
  user: User | null;
  db: typeof db;
};

export async function createContext(): Promise<Context> {
  const user = await getCurrentUser();
  return { user, db };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// 需要登入的 procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource.',
    });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});
