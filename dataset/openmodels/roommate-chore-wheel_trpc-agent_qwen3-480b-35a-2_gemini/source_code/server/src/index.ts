import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserInputSchema, 
  createChoreInputSchema, 
  assignChoresInputSchema, 
  getUserChoresInputSchema, 
  markChoreCompleteInputSchema 
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createChore } from './handlers/create_chore';
import { getUsers } from './handlers/get_users';
import { getChores } from './handlers/get_chores';
import { assignChores } from './handlers/assign_chores';
import { getUserChores } from './handlers/get_user_chores';
import { markChoreComplete } from './handlers/mark_chore_complete';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User procedures
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
    
  // Chore procedures
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),
  getChores: publicProcedure
    .query(() => getChores()),
    
  // Weekly chore assignment procedures
  assignChores: publicProcedure
    .input(assignChoresInputSchema)
    .mutation(({ input }) => assignChores(input)),
  getUserChores: publicProcedure
    .input(getUserChoresInputSchema)
    .query(({ input }) => getUserChores(input)),
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
