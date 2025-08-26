import { initTRPC } from '@trpc/server';
import { createParticipant, getParticipants } from './handlers/create_participant';
import { createChore, getChores } from './handlers/create_chore';
import { generateAssignments, getAssignments, markAssignmentCompleted } from './handlers/assignments';
import { createParticipantInputSchema, createChoreInputSchema, generateAssignmentsInputSchema, markAssignmentCompletedInputSchema } from './schema';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Participants
  createParticipant: publicProcedure
    .input(createParticipantInputSchema)
    .mutation(({ input }) => createParticipant(input)),
  getParticipants: publicProcedure
    .query(() => getParticipants()),
  // Chores
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),
  getChores: publicProcedure
    .query(() => getChores()),
  // Assignments
  generateAssignments: publicProcedure
    .input(generateAssignmentsInputSchema)
    .mutation(({ input }) => generateAssignments(input)),
  getAssignments: publicProcedure
    .query(() => getAssignments()),
  markAssignmentCompleted: publicProcedure
    .input(markAssignmentCompletedInputSchema)
    .mutation(({ input }) => markAssignmentCompleted(input)),

  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
