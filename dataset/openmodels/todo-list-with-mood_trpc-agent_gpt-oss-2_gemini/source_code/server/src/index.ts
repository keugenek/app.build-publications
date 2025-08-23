import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schemas
import {
  createTaskInputSchema,
  updateTaskInputSchema,
  createMoodLogInputSchema,
  updateMoodLogInputSchema,
} from './schema';

// Handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { createMoodLog } from './handlers/create_mood_log';
import { getMoodLogs } from './handlers/get_mood_logs';
import { updateMoodLog } from './handlers/update_mood_log';
import { deleteMoodLog } from './handlers/delete_mood_log';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  getTasks: publicProcedure.query(() => getTasks()),
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  deleteTask: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTask(input.id)),

  // Mood Log routes
  createMoodLog: publicProcedure
    .input(createMoodLogInputSchema)
    .mutation(({ input }) => createMoodLog(input)),
  getMoodLogs: publicProcedure.query(() => getMoodLogs()),
  updateMoodLog: publicProcedure
    .input(updateMoodLogInputSchema)
    .mutation(({ input }) => updateMoodLog(input)),
  deleteMoodLog: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMoodLog(input.id)),

  // Healthcheck
  healthcheck: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
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
