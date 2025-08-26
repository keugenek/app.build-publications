import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createDailyMetricsInputSchema, updateDailyMetricsInputSchema } from './schema';
import { createDailyMetrics } from './handlers/create_daily_metrics';
import { getDailyMetrics } from './handlers/get_daily_metrics';
import { getMetricsByDate } from './handlers/get_metrics_by_date';
import { updateDailyMetrics } from './handlers/update_daily_metrics';
import { getBreakSuggestions } from './handlers/get_break_suggestions';
import { deleteDailyMetrics } from './handlers/delete_daily_metrics';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createDailyMetrics: publicProcedure
    .input(createDailyMetricsInputSchema)
    .mutation(({ input }) => createDailyMetrics(input)),
  getDailyMetrics: publicProcedure
    .query(() => getDailyMetrics()),
  getMetricsByDate: publicProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(({ input }) => getMetricsByDate(input.date)),
  updateDailyMetrics: publicProcedure
    .input(updateDailyMetricsInputSchema)
    .mutation(({ input }) => updateDailyMetrics(input)),
  getBreakSuggestions: publicProcedure
    .query(() => getBreakSuggestions()),
  deleteDailyMetrics: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteDailyMetrics(input)),
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
