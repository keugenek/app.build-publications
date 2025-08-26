import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createTaskInputSchema,
  updateTaskInputSchema,
  createMoodEntryInputSchema,
  updateMoodEntryInputSchema,
  dateRangeInputSchema,
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { createMoodEntry } from './handlers/create_mood_entry';
import { getMoodEntries } from './handlers/get_mood_entries';
import { updateMoodEntry } from './handlers/update_mood_entry';
import { getDailySummary } from './handlers/get_daily_summary';
import { getDailySummaries } from './handlers/get_daily_summaries';

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

  // Task management routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  getTasks: publicProcedure
    .query(() => getTasks()),

  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  deleteTask: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTask(input.id)),

  // Mood tracking routes
  createMoodEntry: publicProcedure
    .input(createMoodEntryInputSchema)
    .mutation(({ input }) => createMoodEntry(input)),

  getMoodEntries: publicProcedure
    .input(dateRangeInputSchema.optional())
    .query(({ input }) => getMoodEntries(input)),

  updateMoodEntry: publicProcedure
    .input(updateMoodEntryInputSchema)
    .mutation(({ input }) => updateMoodEntry(input)),

  // Daily summary routes
  getDailySummary: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(({ input }) => getDailySummary(input.date)),

  getDailySummaries: publicProcedure
    .input(dateRangeInputSchema.optional())
    .query(({ input }) => getDailySummaries(input)),
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
