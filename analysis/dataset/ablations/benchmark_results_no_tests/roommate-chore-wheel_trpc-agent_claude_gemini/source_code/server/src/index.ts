import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createChoreInputSchema, 
  updateChoreCompletionSchema, 
  assignWeeklyChoresSchema 
} from './schema';

// Import handlers
import { createChore } from './handlers/create_chore';
import { getChores } from './handlers/get_chores';
import { getWeeklyChores } from './handlers/get_weekly_chores';
import { updateChoreCompletion } from './handlers/update_chore_completion';
import { assignWeeklyChores } from './handlers/assign_weekly_chores';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new chore
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),

  // Get all chores
  getChores: publicProcedure
    .query(() => getChores()),

  // Get chores for a specific week
  getWeeklyChores: publicProcedure
    .input(z.object({ weekStartDate: z.coerce.date().optional() }))
    .query(({ input }) => getWeeklyChores(input.weekStartDate)),

  // Update chore completion status
  updateChoreCompletion: publicProcedure
    .input(updateChoreCompletionSchema)
    .mutation(({ input }) => updateChoreCompletion(input)),

  // Assign chores randomly for a week
  assignWeeklyChores: publicProcedure
    .input(assignWeeklyChoresSchema)
    .mutation(({ input }) => assignWeeklyChores(input)),
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
