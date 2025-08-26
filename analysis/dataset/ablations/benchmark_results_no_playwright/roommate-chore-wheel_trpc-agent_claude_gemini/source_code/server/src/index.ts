import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createMemberInputSchema, 
  createChoreInputSchema,
  markAssignmentCompletedInputSchema,
  generateWeeklyAssignmentsInputSchema,
  weekQuerySchema
} from './schema';

// Import handlers
import { createMember } from './handlers/create_member';
import { getMembers } from './handlers/get_members';
import { createChore } from './handlers/create_chore';
import { getChores } from './handlers/get_chores';
import { generateWeeklyAssignments } from './handlers/generate_weekly_assignments';
import { getWeeklyAssignments } from './handlers/get_weekly_assignments';
import { markAssignmentCompleted } from './handlers/mark_assignment_completed';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Member management
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
  
  getMembers: publicProcedure
    .query(() => getMembers()),

  // Chore management  
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),
  
  getChores: publicProcedure
    .query(() => getChores()),

  // Assignment management
  generateWeeklyAssignments: publicProcedure
    .input(generateWeeklyAssignmentsInputSchema)
    .mutation(({ input }) => generateWeeklyAssignments(input)),
  
  getWeeklyAssignments: publicProcedure
    .input(weekQuerySchema)
    .query(({ input }) => getWeeklyAssignments(input)),
  
  markAssignmentCompleted: publicProcedure
    .input(markAssignmentCompletedInputSchema)
    .mutation(({ input }) => markAssignmentCompleted(input)),
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
