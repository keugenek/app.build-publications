import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createPomodoroSessionInputSchema,
  updatePomodoroSessionInputSchema,
  startPhaseInputSchema,
  completePhaseInputSchema,
  getDailyLogsInputSchema
} from './schema';

// Import handlers
import { createPomodoroSession } from './handlers/create_pomodoro_session';
import { getActiveSession } from './handlers/get_active_session';
import { updatePomodoroSession } from './handlers/update_pomodoro_session';
import { startPhase } from './handlers/start_phase';
import { completePhase } from './handlers/complete_phase';
import { getSessionStats } from './handlers/get_session_stats';
import { getDailyLogs } from './handlers/get_daily_logs';
import { getNextPhaseType } from './handlers/get_next_phase_type';

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

  // Create a new pomodoro session with customizable intervals
  createPomodoroSession: publicProcedure
    .input(createPomodoroSessionInputSchema)
    .mutation(({ input }) => createPomodoroSession(input)),

  // Get the currently active session (if any)
  getActiveSession: publicProcedure
    .query(() => getActiveSession()),

  // Update session settings (work/break durations, long break interval)
  updatePomodoroSession: publicProcedure
    .input(updatePomodoroSessionInputSchema)
    .mutation(({ input }) => updatePomodoroSession(input)),

  // Start a new phase (work, short break, or long break)
  startPhase: publicProcedure
    .input(startPhaseInputSchema)
    .mutation(({ input }) => startPhase(input)),

  // Complete the current active phase
  completePhase: publicProcedure
    .input(completePhaseInputSchema)
    .mutation(({ input }) => completePhase(input)),

  // Get statistics for a specific session
  getSessionStats: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getSessionStats(input.sessionId)),

  // Get daily log entries for tracking completed pomodoros
  getDailyLogs: publicProcedure
    .input(getDailyLogsInputSchema)
    .query(({ input }) => getDailyLogs(input)),

  // Get the next phase type based on session state
  getNextPhaseType: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getNextPhaseType(input.sessionId)),
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
  console.log(`TRPC Pomodoro Timer server listening at port: ${port}`);
}

start();
