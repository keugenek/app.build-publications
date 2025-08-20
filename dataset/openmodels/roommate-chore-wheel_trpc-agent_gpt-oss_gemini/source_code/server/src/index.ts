import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import {
  createUserInputSchema,
  createChoreInputSchema,
  assignWeeklyInputSchema,
  markAssignmentCompleteInputSchema,
} from './schema';

// Import handler functions
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createChore } from './handlers/create_chore';
import { getChores } from './handlers/get_chores';
import { assignWeekly } from './handlers/assign_weekly';
import { getAssignments } from './handlers/get_assignments';
import { markAssignmentComplete } from './handlers/mark_assignment_complete';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Users
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure.query(() => getUsers()),

  // Chores
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),
  getChores: publicProcedure.query(() => getChores()),

  // Assignments
  assignWeekly: publicProcedure
    .input(assignWeeklyInputSchema)
    .mutation(({ input }) => assignWeekly(input)),
  getAssignments: publicProcedure
    .input(assignWeeklyInputSchema) // week_start as input
    .query(({ input }) => getAssignments(input.week_start)),
  markAssignmentComplete: publicProcedure
    .input(markAssignmentCompleteInputSchema)
    .mutation(({ input }) => markAssignmentComplete(input)),
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
