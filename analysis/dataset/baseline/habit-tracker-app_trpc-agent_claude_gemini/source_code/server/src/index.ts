import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import { 
  createHabitInputSchema,
  updateHabitInputSchema,
  deleteHabitInputSchema,
  markHabitCompletedInputSchema,
  removeHabitCompletionInputSchema,
  getHabitCompletionsInputSchema
} from './schema';

// Import handlers
import { createHabit } from './handlers/create_habit';
import { getHabits } from './handlers/get_habits';
import { getHabitsWithStreaks } from './handlers/get_habits_with_streaks';
import { updateHabit } from './handlers/update_habit';
import { deleteHabit } from './handlers/delete_habit';
import { markHabitCompleted } from './handlers/mark_habit_completed';
import { removeHabitCompletion } from './handlers/remove_habit_completion';
import { getHabitCompletions } from './handlers/get_habit_completions';

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

  // Habit management endpoints
  createHabit: publicProcedure
    .input(createHabitInputSchema)
    .mutation(({ input }) => createHabit(input)),

  getHabits: publicProcedure
    .query(() => getHabits()),

  getHabitsWithStreaks: publicProcedure
    .query(() => getHabitsWithStreaks()),

  updateHabit: publicProcedure
    .input(updateHabitInputSchema)
    .mutation(({ input }) => updateHabit(input)),

  deleteHabit: publicProcedure
    .input(deleteHabitInputSchema)
    .mutation(({ input }) => deleteHabit(input)),

  // Habit completion endpoints
  markHabitCompleted: publicProcedure
    .input(markHabitCompletedInputSchema)
    .mutation(({ input }) => markHabitCompleted(input)),

  removeHabitCompletion: publicProcedure
    .input(removeHabitCompletionInputSchema)
    .mutation(({ input }) => removeHabitCompletion(input)),

  getHabitCompletions: publicProcedure
    .input(getHabitCompletionsInputSchema)
    .query(({ input }) => getHabitCompletions(input)),
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
