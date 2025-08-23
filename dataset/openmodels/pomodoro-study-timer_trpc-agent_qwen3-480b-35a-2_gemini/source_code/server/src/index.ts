import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createPomodoroSettingsInputSchema, updatePomodoroSettingsInputSchema, createPomodoroSessionInputSchema, timerStateSchema } from './schema';
import { getPomodoroSettings } from './handlers/get_pomodoro_settings';
import { createPomodoroSettings } from './handlers/create_pomodoro_settings';
import { updatePomodoroSettings } from './handlers/update_pomodoro_settings';
import { getPomodoroSessions } from './handlers/get_pomodoro_sessions';
import { createPomodoroSession } from './handlers/create_pomodoro_session';
import { getTimerState } from './handlers/get_timer_state';
import { updateTimerState } from './handlers/update_timer_state';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  getPomodoroSettings: publicProcedure.query(() => getPomodoroSettings()),
  createPomodoroSettings: publicProcedure
    .input(createPomodoroSettingsInputSchema)
    .mutation(({ input }) => createPomodoroSettings(input)),
  updatePomodoroSettings: publicProcedure
    .input(updatePomodoroSettingsInputSchema)
    .mutation(({ input }) => updatePomodoroSettings(input)),
  getPomodoroSessions: publicProcedure.query(() => getPomodoroSessions()),
  createPomodoroSession: publicProcedure
    .input(createPomodoroSessionInputSchema)
    .mutation(({ input }) => createPomodoroSession(input)),
  getTimerState: publicProcedure.query(() => getTimerState()),
  updateTimerState: publicProcedure
    .input(timerStateSchema.partial())
    .mutation(({ input }) => updateTimerState(input)),
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
