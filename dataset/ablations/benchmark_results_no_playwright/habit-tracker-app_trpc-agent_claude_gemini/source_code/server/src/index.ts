import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createHabitInputSchema, 
  markHabitCompleteInputSchema,
  getHabitStreakInputSchema 
} from './schema';

// Import handlers
import { createHabit } from './handlers/create_habit';
import { getHabits } from './handlers/get_habits';
import { getHabitsWithStreaks } from './handlers/get_habits_with_streaks';
import { markHabitComplete } from './handlers/mark_habit_complete';
import { getHabitStreak } from './handlers/get_habit_streak';

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

  // Create a new habit
  createHabit: publicProcedure
    .input(createHabitInputSchema)
    .mutation(({ input }) => createHabit(input)),

  // Get all habits (basic list)
  getHabits: publicProcedure
    .query(() => getHabits()),

  // Get all habits with streak information (for main dashboard)
  getHabitsWithStreaks: publicProcedure
    .query(() => getHabitsWithStreaks()),

  // Mark a habit as complete/incomplete for a specific date
  markHabitComplete: publicProcedure
    .input(markHabitCompleteInputSchema)
    .mutation(({ input }) => markHabitComplete(input)),

  // Get detailed streak information for a specific habit
  getHabitStreak: publicProcedure
    .input(getHabitStreakInputSchema)
    .query(({ input }) => getHabitStreak(input)),
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
