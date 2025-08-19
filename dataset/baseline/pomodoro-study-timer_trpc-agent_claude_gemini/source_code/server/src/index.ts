import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createSessionInputSchema, timerSettingsSchema } from './schema';
import { createSession } from './handlers/create_session';
import { getSessions } from './handlers/get_sessions';
import { getSessionStats } from './handlers/get_session_stats';

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
  
  // Create a completed session (work or break)
  createSession: publicProcedure
    .input(createSessionInputSchema)
    .mutation(({ input }) => createSession(input)),
  
  // Get all completed sessions for the log
  getSessions: publicProcedure
    .query(() => getSessions()),
  
  // Get session statistics summary
  getSessionStats: publicProcedure
    .query(() => getSessionStats()),
  
  // Validate timer settings (for client-side configuration)
  validateTimerSettings: publicProcedure
    .input(timerSettingsSchema)
    .query(({ input }) => {
      return { valid: true, settings: input };
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
