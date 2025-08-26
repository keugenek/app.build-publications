import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createTimerSessionInputSchema,
  updateTimerSettingsInputSchema,
  getSessionLogsInputSchema
} from './schema';

// Import handlers
import { createTimerSession } from './handlers/create_timer_session';
import { getTimerSettings } from './handlers/get_timer_settings';
import { updateTimerSettings } from './handlers/update_timer_settings';
import { getSessionLogs } from './handlers/get_session_logs';
import { getDailySessionSummary } from './handlers/get_daily_session_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Timer session management
  createTimerSession: publicProcedure
    .input(createTimerSessionInputSchema)
    .mutation(({ input }) => createTimerSession(input)),
  
  // Timer settings management
  getTimerSettings: publicProcedure
    .query(() => getTimerSettings()),
    
  updateTimerSettings: publicProcedure
    .input(updateTimerSettingsInputSchema)
    .mutation(({ input }) => updateTimerSettings(input)),
  
  // Session logs and analytics
  getSessionLogs: publicProcedure
    .input(getSessionLogsInputSchema)
    .query(({ input }) => getSessionLogs(input)),
    
  getDailySessionSummary: publicProcedure
    .input(z.string().optional()) // Optional date string in YYYY-MM-DD format
    .query(({ input }) => getDailySessionSummary(input)),
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
  console.log(`Pomodoro Timer TRPC server listening at port: ${port}`);
}

start();
