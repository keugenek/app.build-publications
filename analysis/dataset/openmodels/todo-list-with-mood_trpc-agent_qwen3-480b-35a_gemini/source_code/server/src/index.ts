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
  deleteMoodEntryInputSchema
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { createMoodEntry } from './handlers/create_mood_entry';
import { getMoodEntries } from './handlers/get_mood_entries';
import { updateMoodEntry } from './handlers/update_mood_entry';
import { deleteMoodEntry } from './handlers/delete_mood_entry';
import { getHistoricalView } from './handlers/get_historical_view';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Task endpoints
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  getTasks: publicProcedure
    .query(() => getTasks()),
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),
    
  // Mood entry endpoints
  createMoodEntry: publicProcedure
    .input(createMoodEntryInputSchema)
    .mutation(({ input }) => createMoodEntry(input)),
  getMoodEntries: publicProcedure
    .query(() => getMoodEntries()),
  updateMoodEntry: publicProcedure
    .input(updateMoodEntryInputSchema)
    .mutation(({ input }) => updateMoodEntry(input)),
  deleteMoodEntry: publicProcedure
    .input(deleteMoodEntryInputSchema)
    .mutation(({ input }) => deleteMoodEntry(input)),
    
  // Historical view endpoint
  getHistoricalView: publicProcedure
    .query(() => getHistoricalView()),
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
