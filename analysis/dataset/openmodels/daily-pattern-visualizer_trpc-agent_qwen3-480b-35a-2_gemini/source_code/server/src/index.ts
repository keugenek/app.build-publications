import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createDailyLogInputSchema } from './schema';
import { createDailyLog } from './handlers/create_daily_log';
import { getDailyLogs } from './handlers/get_daily_logs';
import { getBreakSuggestions } from './handlers/get_break_suggestions';
import { getDailyLogsByPeriod } from './handlers/get_daily_logs_by_period';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createDailyLog: publicProcedure
    .input(createDailyLogInputSchema)
    .mutation(({ input }) => createDailyLog(input)),
  getDailyLogs: publicProcedure
    .query(() => getDailyLogs()),
  getDailyLogsByPeriod: publicProcedure
    .input(z.object({ period: z.enum(['daily', 'weekly', 'monthly']) }))
    .query(({ input }) => getDailyLogsByPeriod(input.period)),
  getBreakSuggestions: publicProcedure
    .query(async () => {
      const logs = await getDailyLogs();
      return getBreakSuggestions(logs);
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
