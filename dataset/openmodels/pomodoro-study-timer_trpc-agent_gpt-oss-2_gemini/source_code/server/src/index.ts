import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { createPomodoroSessionInputSchema, updatePomodoroSessionInputSchema } from './schema';
import { createPomodoroSession, getPomodoroSessions, updatePomodoroSession } from './handlers';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Initialize tRPC with SuperJSON transformer for richer data types
const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Define the application router with healthcheck and Pomodoro endpoints
const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Create a new Pomodoro session
  createSession: publicProcedure
    .input(createPomodoroSessionInputSchema)
    .mutation(({ input }) => createPomodoroSession(input)),
  // Retrieve all Pomodoro sessions
  getSessions: publicProcedure.query(() => getPomodoroSessions()),
  // Update an existing Pomodoro session (e.g., mark as completed)
  updateSession: publicProcedure
    .input(updatePomodoroSessionInputSchema)
    .mutation(({ input }) => updatePomodoroSession(input)),
});

export type AppRouter = typeof appRouter;

// Start the HTTP server
async function start() {
  const port = Number(process.env['SERVER_PORT'] ?? '2022');
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
