import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import {
  createPomodoroSettingsInputSchema,
  updatePomodoroSettingsInputSchema,
  createPomodoroLogInputSchema,
} from './schema';

// Import handler functions (placeholder implementations)
import { createPomodoroSettings } from './handlers/create_pomodoro_settings';
import { getPomodoroSettings } from './handlers/get_pomodoro_settings';
import { updatePomodoroSettings } from './handlers/update_pomodoro_settings';
import { createPomodoroLog } from './handlers/create_pomodoro_log';
import { getPomodoroLogs } from './handlers/get_pomodoro_logs';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Settings endpoints
  createPomodoroSettings: publicProcedure
    .input(createPomodoroSettingsInputSchema)
    .mutation(({ input }) => createPomodoroSettings(input)),
  getPomodoroSettings: publicProcedure.query(() => getPomodoroSettings()),
  updatePomodoroSettings: publicProcedure
    .input(updatePomodoroSettingsInputSchema)
    .mutation(({ input }) => updatePomodoroSettings(input)),
  // Log endpoints
  createPomodoroLog: publicProcedure
    .input(createPomodoroLogInputSchema)
    .mutation(({ input }) => createPomodoroLog(input)),
  getPomodoroLogs: publicProcedure.query(() => getPomodoroLogs()),
  // Healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
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
