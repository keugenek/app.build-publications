import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createHabitInputSchema, markHabitCompletionInputSchema, updateHabitInputSchema } from './schema';
import { createHabit } from './handlers/create_habit';
import { getHabits } from './handlers/get_habits';
import { getHabit } from './handlers/get_habit';
import { markHabitCompletion } from './handlers/mark_habit_completion';
import { updateHabit } from './handlers/update_habit';
import { deleteHabit } from './handlers/delete_habit';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createHabit: publicProcedure
    .input(createHabitInputSchema)
    .mutation(({ input }) => createHabit(input)),
  getHabits: publicProcedure
    .query(() => getHabits()),
  getHabit: publicProcedure
    .input(z.number())
    .query(({ input }) => getHabit(input)),
  updateHabit: publicProcedure
    .input(updateHabitInputSchema)
    .mutation(({ input }) => updateHabit(input)),
  deleteHabit: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteHabit(input)),
  markHabitCompletion: publicProcedure
    .input(markHabitCompletionInputSchema)
    .mutation(({ input }) => markHabitCompletion(input)),
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
