import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { logActivityInputSchema } from './schema';
import { logActivity } from './handlers/log_activity';
import { getActivities } from './handlers/get_activities';
import { getDailyConspiracy } from './handlers/get_daily_conspiracy';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
  // Log a new suspicious cat activity
  logActivity: publicProcedure
    .input(logActivityInputSchema)
    .mutation(({ input }) => logActivity(input)),
  // Retrieve all logged activities
  getActivities: publicProcedure.query(() => getActivities()),
  // Retrieve daily conspiracy summary
  getDailyConspiracy: publicProcedure.query(() => getDailyConspiracy()),
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
