import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createDailyEntryInputSchema,
  updateDailyEntryInputSchema,
  getDailyEntriesInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema
} from './schema';

// Import handlers
import { createDailyEntry } from './handlers/create_daily_entry';
import { updateDailyEntry } from './handlers/update_daily_entry';
import { getDailyEntries } from './handlers/get_daily_entries';
import { getDailyEntryWithTasks } from './handlers/get_daily_entry_with_tasks';
import { getDailyEntryByDate } from './handlers/get_daily_entry_by_date';
import { createTask } from './handlers/create_task';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';

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

  // Daily entry routes
  createDailyEntry: publicProcedure
    .input(createDailyEntryInputSchema)
    .mutation(({ input }) => createDailyEntry(input)),

  updateDailyEntry: publicProcedure
    .input(updateDailyEntryInputSchema)
    .mutation(({ input }) => updateDailyEntry(input)),

  getDailyEntries: publicProcedure
    .input(getDailyEntriesInputSchema.optional())
    .query(({ input }) => getDailyEntries(input)),

  getDailyEntryById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getDailyEntryWithTasks(input.id)),

  getDailyEntryByDate: publicProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(({ input }) => getDailyEntryByDate(input.date)),

  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  deleteTask: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTask(input.id)),
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
  console.log(`Daily Journal TRPC server listening at port: ${port}`);
}

start();
