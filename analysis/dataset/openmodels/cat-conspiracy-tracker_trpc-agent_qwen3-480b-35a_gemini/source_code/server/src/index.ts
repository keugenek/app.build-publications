import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createSuspiciousActivityInputSchema } from './schema';
import { createSuspiciousActivity } from './handlers/create_suspicious_activity';
import { getSuspiciousActivities } from './handlers/get_suspicious_activities';
import { getDailyConspiracyLevel } from './handlers/get_daily_conspiracy_level';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createSuspiciousActivity: publicProcedure
    .input(createSuspiciousActivityInputSchema)
    .mutation(({ input }) => createSuspiciousActivity(input)),
  getSuspiciousActivities: publicProcedure
    .query(() => getSuspiciousActivities()),
  getDailyConspiracyLevel: publicProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(({ input }) => getDailyConspiracyLevel(input.date)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
