import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createHabitInputSchema, 
  updateHabitInputSchema,
  trackHabitInputSchema,
  getHabitProgressInputSchema 
} from './schema';

// Import handlers
import { createHabit } from './handlers/create_habit';
import { getHabits } from './handlers/get_habits';
import { updateHabit } from './handlers/update_habit';
import { deleteHabit } from './handlers/delete_habit';
import { trackHabit } from './handlers/track_habit';
import { getHabitProgress } from './handlers/get_habit_progress';
import { getHabitsWithStreaks } from './handlers/get_habits_with_streaks';
import { getHabitStreak } from './handlers/get_habit_streak';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Habit management
  createHabit: publicProcedure
    .input(createHabitInputSchema)
    .mutation(({ input }) => createHabit(input)),

  getHabits: publicProcedure
    .query(() => getHabits()),

  updateHabit: publicProcedure
    .input(updateHabitInputSchema)
    .mutation(({ input }) => updateHabit(input)),

  deleteHabit: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteHabit(input)),

  // Habit tracking
  trackHabit: publicProcedure
    .input(trackHabitInputSchema)
    .mutation(({ input }) => trackHabit(input)),

  getHabitProgress: publicProcedure
    .input(getHabitProgressInputSchema)
    .query(({ input }) => getHabitProgress(input)),

  // Streak tracking
  getHabitsWithStreaks: publicProcedure
    .query(() => getHabitsWithStreaks()),

  getHabitStreak: publicProcedure
    .input(z.number())
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
