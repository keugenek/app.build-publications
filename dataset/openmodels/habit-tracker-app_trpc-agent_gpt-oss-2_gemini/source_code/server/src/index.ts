import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import handlers and schemas
import { createHabit, getHabits, createHabitCheck, getHabitChecks, getHabitStreak } from './handlers';
import { createHabitInputSchema, createHabitCheckInputSchema } from './schema';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Habit routes
  createHabit: publicProcedure
    .input(createHabitInputSchema)
    .mutation(({ input }) => createHabit(input)),
  getHabits: publicProcedure.query(() => getHabits()),

  // Habit check routes
  createHabitCheck: publicProcedure
    .input(createHabitCheckInputSchema)
    .mutation(({ input }) => createHabitCheck(input)),
  getHabitChecks: publicProcedure.query(() => getHabitChecks()),

  // Streak route (placeholder)
  getHabitStreak: publicProcedure.query(() => getHabitStreak()),

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
