import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  createChoreInputSchema, 
  createUserInputSchema, 
  assignChoresInputSchema, 
  updateAssignmentCompletionInputSchema 
} from './schema';

// Handler imports
import { createChore } from './handlers/create_chore';
import { createUser } from './handlers/create_user';
import { getChores } from './handlers/get_chores';
import { getUsers } from './handlers/get_users';
import { assignChores } from './handlers/assign_chores';
import { getCurrentWeekAssignments } from './handlers/get_current_week_assignments';
import { updateAssignmentCompletion } from './handlers/update_assignment_completion';
import { getUserAssignments } from './handlers/get_user_assignments';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Chore management
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),
  getChores: publicProcedure
    .query(() => getChores()),
    
  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
    
  // Assignment management
  assignChores: publicProcedure
    .input(assignChoresInputSchema)
    .mutation(({ input }) => assignChores(input)),
  getCurrentWeekAssignments: publicProcedure
    .query(() => getCurrentWeekAssignments()),
  getUserAssignments: publicProcedure
    .input(z.number())
    .query(({ input }) => getUserAssignments(input)),
  updateAssignmentCompletion: publicProcedure
    .input(updateAssignmentCompletionInputSchema)
    .mutation(({ input }) => updateAssignmentCompletion(input)),
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
  
  // Log available routes
  console.log('Available routes:');
  console.log('- healthcheck');
  console.log('- createChore');
  console.log('- getChores');
  console.log('- createUser');
  console.log('- getUsers');
  console.log('- assignChores');
  console.log('- getCurrentWeekAssignments');
  console.log('- getUserAssignments');
  console.log('- updateAssignmentCompletion');
}

start();
