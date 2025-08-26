import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  createDailyLogInputSchema,
  updateDailyLogInputSchema, 
  getLogsByDateRangeSchema,
  getLogByDateSchema
} from './schema';

// Import handlers
import { createDailyLog } from './handlers/create_daily_log';
import { updateDailyLog } from './handlers/update_daily_log';
import { getDailyLogByDate } from './handlers/get_daily_log_by_date';
import { getLogsByDateRange } from './handlers/get_logs_by_date_range';
import { getWeeklyTrends } from './handlers/get_weekly_trends';
import { getBreakSuggestions } from './handlers/get_break_suggestions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new daily log entry
  createDailyLog: publicProcedure
    .input(createDailyLogInputSchema)
    .mutation(({ input }) => createDailyLog(input)),

  // Update an existing daily log entry
  updateDailyLog: publicProcedure
    .input(updateDailyLogInputSchema)
    .mutation(({ input }) => updateDailyLog(input)),

  // Get daily log for a specific date
  getDailyLogByDate: publicProcedure
    .input(getLogByDateSchema)
    .query(({ input }) => getDailyLogByDate(input)),

  // Get daily logs within a date range
  getLogsByDateRange: publicProcedure
    .input(getLogsByDateRangeSchema)
    .query(({ input }) => getLogsByDateRange(input)),

  // Get current day's log (convenience endpoint)
  getTodayLog: publicProcedure
    .query(() => {
      const today = new Date().toISOString().split('T')[0];
      return getDailyLogByDate({ date: today });
    }),

  // Get weekly trends for visualization
  getWeeklyTrends: publicProcedure
    .input(z.object({
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional()
    }).optional())
    .query(({ input }) => getWeeklyTrends(input?.start_date)),

  // Get break suggestions based on work and screen time
  getBreakSuggestions: publicProcedure
    .input(z.object({
      work_hours: z.number().min(0).max(24),
      screen_time: z.number().min(0).max(24)
    }))
    .query(({ input }) => getBreakSuggestions(input.work_hours, input.screen_time)),

  // Get break suggestions for current day (convenience endpoint)
  getTodayBreakSuggestions: publicProcedure
    .query(async () => {
      const today = new Date().toISOString().split('T')[0];
      const todayLog = await getDailyLogByDate({ date: today });
      
      if (!todayLog) {
        return getBreakSuggestions(0, 0);
      }
      
      return getBreakSuggestions(todayLog.work_hours, todayLog.screen_time);
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
