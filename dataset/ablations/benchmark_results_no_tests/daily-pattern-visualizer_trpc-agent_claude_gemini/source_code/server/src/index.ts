import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createDailyMetricsInputSchema,
  updateDailyMetricsInputSchema,
  getMetricsByDateInputSchema,
  getMetricsByDateRangeInputSchema,
  startWorkSessionInputSchema,
  endWorkSessionInputSchema
} from './schema';

// Import handlers
import { createDailyMetrics } from './handlers/create_daily_metrics';
import { updateDailyMetrics } from './handlers/update_daily_metrics';
import { getDailyMetricsByDate } from './handlers/get_daily_metrics_by_date';
import { getMetricsByDateRange } from './handlers/get_metrics_by_date_range';
import { startWorkSession } from './handlers/start_work_session';
import { endWorkSession } from './handlers/end_work_session';
import { getActiveWorkSession } from './handlers/get_active_work_session';
import { getWorkSessionsByDate } from './handlers/get_work_sessions_by_date';
import { checkBreakAlert } from './handlers/check_break_alert';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Daily metrics routes
  createDailyMetrics: publicProcedure
    .input(createDailyMetricsInputSchema)
    .mutation(({ input }) => createDailyMetrics(input)),

  updateDailyMetrics: publicProcedure
    .input(updateDailyMetricsInputSchema)
    .mutation(({ input }) => updateDailyMetrics(input)),

  getDailyMetricsByDate: publicProcedure
    .input(getMetricsByDateInputSchema)
    .query(({ input }) => getDailyMetricsByDate(input)),

  getMetricsByDateRange: publicProcedure
    .input(getMetricsByDateRangeInputSchema)
    .query(({ input }) => getMetricsByDateRange(input)),

  // Work session routes
  startWorkSession: publicProcedure
    .input(startWorkSessionInputSchema)
    .mutation(({ input }) => startWorkSession(input)),

  endWorkSession: publicProcedure
    .input(endWorkSessionInputSchema)
    .mutation(({ input }) => endWorkSession(input)),

  getActiveWorkSession: publicProcedure
    .query(() => getActiveWorkSession()),

  getWorkSessionsByDate: publicProcedure
    .input(getMetricsByDateInputSchema)
    .query(({ input }) => getWorkSessionsByDate(input)),

  // Break management
  checkBreakAlert: publicProcedure
    .query(() => checkBreakAlert()),
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
