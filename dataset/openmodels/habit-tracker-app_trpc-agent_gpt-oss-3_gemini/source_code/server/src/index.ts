import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createHabitInputSchema, markHabitCompletionInputSchema } from './schema';
import { createHabit } from './handlers/create_habit';
import { getHabits } from './handlers/get_habits';
import { markHabitCompletion } from './handlers/mark_habit_completion';
import { getHabitStreak } from './handlers/get_habit_streak';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck route
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new habit
  createHabit: publicProcedure
    .input(createHabitInputSchema)
    .mutation(({ input }) => createHabit(input)),

  // Get all habits
  getHabits: publicProcedure.query(() => getHabits()),

  // Mark habit completion for a day
  markHabitCompletion: publicProcedure
    .input(markHabitCompletionInputSchema)
    .mutation(({ input }) => markHabitCompletion(input)),

  // Get streak for a habit (current consecutive days completed)
  getHabitStreak: publicProcedure
    .input(z.object({ habit_id: z.number() }))
    .query(({ input }) => getHabitStreak(input.habit_id)),
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
