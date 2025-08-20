import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  updateTimerSettingsInputSchema,
  logSessionInputSchema
} from './schema';

// Import handlers
import { getTimerSettings } from './handlers/get_timer_settings';
import { updateTimerSettings } from './handlers/update_timer_settings';
import { logStudySession } from './handlers/log_study_session';
import { getDailyStats } from './handlers/get_daily_stats';

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

  // Get current timer settings (work and break durations)
  getTimerSettings: publicProcedure
    .query(() => getTimerSettings()),

  // Update timer settings (work and break durations)
  updateTimerSettings: publicProcedure
    .input(updateTimerSettingsInputSchema)
    .mutation(({ input }) => updateTimerSettings(input)),

  // Log a completed study session for today
  logStudySession: publicProcedure
    .input(logSessionInputSchema)
    .mutation(({ input }) => logStudySession(input)),

  // Get daily study session statistics
  getDailyStats: publicProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
    }))
    .query(({ input }) => getDailyStats(input.date)),
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
