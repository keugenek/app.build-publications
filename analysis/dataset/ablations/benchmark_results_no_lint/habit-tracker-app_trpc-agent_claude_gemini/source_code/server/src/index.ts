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
  checkInHabitInputSchema 
} from './schema';

// Import handlers
import { createHabit } from './handlers/create_habit';
import { getHabits } from './handlers/get_habits';
import { getHabitsWithStreaks } from './handlers/get_habits_with_streaks';
import { updateHabit } from './handlers/update_habit';
import { deleteHabit } from './handlers/delete_habit';
import { checkInHabit } from './handlers/check_in_habit';
import { getHabitCheckIns } from './handlers/get_habit_check_ins';

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

  // Habit management routes
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
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteHabit(input.id)),

  // Habit check-in routes
  checkInHabit: publicProcedure
    .input(checkInHabitInputSchema)
    .mutation(({ input }) => checkInHabit(input)),

  getHabitCheckIns: publicProcedure
    .input(z.object({ habitId: z.number() }))
    .query(({ input }) => getHabitCheckIns(input.habitId)),
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
