import { router } from './trpc';
import { userRouter } from './routers/user';
import { clientRouter } from './routers/client';
import { outreachRouter } from './routers/outreach';
import { visitLogRouter } from './routers/visitLog';
import { followUpRouter } from './routers/followUp';
import { gamificationRouter } from './routers/gamification';
import { coachRouter } from './routers/coach';

export const appRouter = router({
  user: userRouter,
  client: clientRouter,
  outreach: outreachRouter,
  visitLog: visitLogRouter,
  followUp: followUpRouter,
  gamification: gamificationRouter,
  coach: coachRouter,
});

export type AppRouter = typeof appRouter;
