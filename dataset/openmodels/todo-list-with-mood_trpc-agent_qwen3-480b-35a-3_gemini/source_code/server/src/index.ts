import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createTaskInputSchema, updateTaskInputSchema } from './schema';
import { logMoodInputSchema } from './schema';
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { logMood } from './handlers/log_mood';
import { getMoods } from './handlers/get_moods';
import { getJournalEntries } from './handlers/get_journal_entries';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  getTasks: publicProcedure
    .query(() => getTasks()),
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  deleteTask: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteTask(input)),
  logMood: publicProcedure
    .input(logMoodInputSchema)
    .mutation(({ input }) => logMood(input)),
  getMoods: publicProcedure
    .query(() => getMoods()),
  getJournalEntries: publicProcedure
    .query(() => getJournalEntries())
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
