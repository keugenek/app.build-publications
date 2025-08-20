import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createMemberInputSchema, 
  createChoreInputSchema, 
  updateAssignmentInputSchema 
} from './schema';

// Import handlers
import { createMember } from './handlers/create_member';
import { createChore } from './handlers/create_chore';
import { getMembers } from './handlers/get_members';
import { getChores } from './handlers/get_chores';
import { assignChores } from './handlers/assign_chores';
import { getAssignments } from './handlers/get_assignments';
import { updateAssignment } from './handlers/update_assignment';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Member procedures
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
  getMembers: publicProcedure
    .query(() => getMembers()),
    
  // Chore procedures
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),
  getChores: publicProcedure
    .query(() => getChores()),
    
  // Assignment procedures
  assignChores: publicProcedure
    .mutation(() => assignChores()),
  getAssignments: publicProcedure
    .query(() => getAssignments()),
  updateAssignment: publicProcedure
    .input(updateAssignmentInputSchema)
    .mutation(({ input }) => updateAssignment(input)),
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
