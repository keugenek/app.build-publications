import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createTaskInputSchema, 
  updateTaskInputSchema, 
  deleteTaskInputSchema,
  createMoodEntryInputSchema,
  updateMoodEntryInputSchema,
  deleteMoodEntryInputSchema,
  getDailyEntryInputSchema,
  getHistoricalEntriesInputSchema
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { getTasks } from './handlers/get_tasks';
import { createMoodEntry } from './handlers/create_mood_entry';
import { updateMoodEntry } from './handlers/update_mood_entry';
import { deleteMoodEntry } from './handlers/delete_mood_entry';
import { getDailyEntry } from './handlers/get_daily_entry';
import { getHistoricalEntries } from './handlers/get_historical_entries';

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
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),
  
  getTasks: publicProcedure
    .query(() => getTasks()),

  // Mood entry management routes
  createMoodEntry: publicProcedure
    .input(createMoodEntryInputSchema)
    .mutation(({ input }) => createMoodEntry(input)),
  
  updateMoodEntry: publicProcedure
    .input(updateMoodEntryInputSchema)
    .mutation(({ input }) => updateMoodEntry(input)),
  
  deleteMoodEntry: publicProcedure
    .input(deleteMoodEntryInputSchema)
    .mutation(({ input }) => deleteMoodEntry(input)),

  // Daily entry and historical view routes
  getDailyEntry: publicProcedure
    .input(getDailyEntryInputSchema)
    .query(({ input }) => getDailyEntry(input)),
  
  getHistoricalEntries: publicProcedure
    .input(getHistoricalEntriesInputSchema)
    .query(({ input }) => getHistoricalEntries(input)),
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
