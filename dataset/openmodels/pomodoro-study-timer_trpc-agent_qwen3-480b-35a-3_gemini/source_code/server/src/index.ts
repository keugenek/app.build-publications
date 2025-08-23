import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { timerSettingsSchema, updateTimerSettingsInputSchema, startTimerInputSchema } from './schema';
import { getTimerSettings } from './handlers/get_timer_settings';
import { updateTimerSettings } from './handlers/update_timer_settings';
import { getTimerState } from './handlers/get_timer_state';
import { startTimer } from './handlers/start_timer';
import { pauseTimer } from './handlers/pause_timer';
import { resetTimer } from './handlers/reset_timer';
import { getTodaysLog } from './handlers/get_todays_log';
import { playSound } from './handlers/play_sound';
import { completeSession } from './handlers/complete_session';
import { initSettings } from './handlers/init_settings';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  initSettings: publicProcedure.mutation(() => initSettings()),
  getTimerSettings: publicProcedure.query(() => getTimerSettings()),
  updateTimerSettings: publicProcedure
    .input(updateTimerSettingsInputSchema)
    .mutation(({ input }) => updateTimerSettings(input)),
  getTimerState: publicProcedure.query(() => getTimerState()),
  startTimer: publicProcedure
    .input(startTimerInputSchema)
    .mutation(({ input }) => startTimer(input)),
  pauseTimer: publicProcedure.mutation(() => pauseTimer()),
  resetTimer: publicProcedure.mutation(() => resetTimer()),
  getTodaysLog: publicProcedure.query(() => getTodaysLog()),
  playSound: publicProcedure
    .input(z.object({ soundType: z.enum(['workComplete', 'breakComplete']) }))
    .mutation(({ input }) => playSound(input.soundType)),
  completeSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => completeSession(input.sessionId)),
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
