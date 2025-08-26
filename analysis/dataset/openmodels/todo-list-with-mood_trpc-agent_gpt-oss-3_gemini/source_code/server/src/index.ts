import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Import schemas
import { createTaskInputSchema } from './schema';
import { createMoodEntryInputSchema } from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { createMoodEntry } from './handlers/create_mood_entry';
import { getMoodEntries } from './handlers/get_mood_entries';

const appRouter = router({
  healthcheck: publicProcedure.query(() => ({ status: 'ok', timestamp: new Date().toISOString() })),
  // Task routes
  createTask: publicProcedure.input(createTaskInputSchema).mutation(({ input }) => createTask(input)),
  getTasks: publicProcedure.query(() => getTasks()),
  // Mood entry routes
  createMoodEntry: publicProcedure.input(createMoodEntryInputSchema).mutation(({ input }) => createMoodEntry(input)),
  getMoodEntries: publicProcedure.query(() => getMoodEntries()),
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
