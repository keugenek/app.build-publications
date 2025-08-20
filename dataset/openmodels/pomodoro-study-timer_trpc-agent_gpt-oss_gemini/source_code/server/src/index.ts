import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Handlers
import { getPomodoroSettings } from './handlers/get_pomodoro_settings';
import { updatePomodoroSettings } from './handlers/update_pomodoro_settings';
import { getPomodoroLog } from './handlers/get_pomodoro_log';
import { incrementSession } from './handlers/increment_session';

// Schemas for input validation
import { updatePomodoroSettingsInputSchema, incrementSessionInputSchema } from './schema';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Pomodoro Settings
  getPomodoroSettings: publicProcedure.query(() => getPomodoroSettings()),
  updatePomodoroSettings: publicProcedure
    .input(updatePomodoroSettingsInputSchema)
    .mutation(({ input }) => updatePomodoroSettings(input)),
  // Pomodoro Log
  getPomodoroLog: publicProcedure.query(() => getPomodoroLog()),
  incrementSession: publicProcedure
    .input(incrementSessionInputSchema)
    .mutation(({ input }) => incrementSession(input)),
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
