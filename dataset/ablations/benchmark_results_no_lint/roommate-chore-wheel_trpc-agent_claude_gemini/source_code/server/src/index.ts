import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createChoreInputSchema, 
  updateChoreInputSchema, 
  generateWeeklyAssignmentsInputSchema,
  markChoreCompleteInputSchema,
  getWeeklyAssignmentsInputSchema
} from './schema';

// Import handlers
import { createChore } from './handlers/create_chore';
import { getChores } from './handlers/get_chores';
import { updateChore } from './handlers/update_chore';
import { deleteChore } from './handlers/delete_chore';
import { generateWeeklyAssignments } from './handlers/generate_weekly_assignments';
import { getWeeklyAssignments } from './handlers/get_weekly_assignments';
import { markChoreComplete } from './handlers/mark_chore_complete';
import { getCurrentWeekAssignments } from './handlers/get_current_week_assignments';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Chore management endpoints
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),

  getChores: publicProcedure
    .query(() => getChores()),

  updateChore: publicProcedure
    .input(updateChoreInputSchema)
    .mutation(({ input }) => updateChore(input)),

  deleteChore: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteChore(input.id)),

  // Weekly assignment endpoints
  generateWeeklyAssignments: publicProcedure
    .input(generateWeeklyAssignmentsInputSchema)
    .mutation(({ input }) => generateWeeklyAssignments(input)),

  getWeeklyAssignments: publicProcedure
    .input(getWeeklyAssignmentsInputSchema)
    .query(({ input }) => getWeeklyAssignments(input)),

  getCurrentWeekAssignments: publicProcedure
    .query(() => getCurrentWeekAssignments()),

  markChoreComplete: publicProcedure
    .input(markChoreCompleteInputSchema)
    .mutation(({ input }) => markChoreComplete(input)),
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
