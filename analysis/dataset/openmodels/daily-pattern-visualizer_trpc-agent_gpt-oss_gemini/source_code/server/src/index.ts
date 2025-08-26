import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createDailyLogInputSchema, updateDailyLogInputSchema } from './schema';
import { createDailyLog } from './handlers/create_daily_log';
import { getDailyLogs } from './handlers/get_daily_logs';
import { updateDailyLog } from './handlers/update_daily_log';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Create a new daily log entry
  createDailyLog: publicProcedure
    .input(createDailyLogInputSchema)
    .mutation(({ input }) => createDailyLog(input)),
  // Retrieve all daily logs
  getDailyLogs: publicProcedure
    .query(() => getDailyLogs()),
  // Update an existing daily log
  updateDailyLog: publicProcedure
    .input(updateDailyLogInputSchema)
    .mutation(({ input }) => updateDailyLog(input)),

  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
