import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schemas
import { createHabitInputSchema, markHabitCompletionInputSchema } from './schema';

// Handlers
import { createHabit } from './handlers/create_habit';
import { getHabits } from './handlers/get_habits';
import { markHabitCompletion } from './handlers/mark_habit_completion';
import { getHabitCompletions } from './handlers/get_habit_completions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Create a new habit
  createHabit: publicProcedure
    .input(createHabitInputSchema)
    .mutation(({ input }) => createHabit(input)),
  // Get all habits
  getHabits: publicProcedure.query(() => getHabits()),
  // Mark habit completion
  markHabitCompletion: publicProcedure
    .input(markHabitCompletionInputSchema)
    .mutation(({ input }) => markHabitCompletion(input)),
  // Get completions for a habit
  getHabitCompletions: publicProcedure
    .input(z.object({ habit_id: z.number() }))
    .query(({ input }) => getHabitCompletions(input.habit_id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = Number(process.env['SERVER_PORT'] ?? 2022);
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext: () => ({}),
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
