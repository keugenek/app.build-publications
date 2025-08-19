import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createParticipantInputSchema,
  updateParticipantInputSchema,
  deleteParticipantInputSchema,
  createChoreInputSchema,
  updateChoreInputSchema,
  deleteChoreInputSchema,
  createWeeklyAssignmentInputSchema,
  getAssignmentsByWeekInputSchema,
  getAssignmentsByParticipantInputSchema,
  completeAssignmentInputSchema
} from './schema';

// Import handlers
import { createParticipant } from './handlers/create_participant';
import { getParticipants } from './handlers/get_participants';
import { updateParticipant } from './handlers/update_participant';
import { deleteParticipant } from './handlers/delete_participant';
import { createChore } from './handlers/create_chore';
import { getChores } from './handlers/get_chores';
import { updateChore } from './handlers/update_chore';
import { deleteChore } from './handlers/delete_chore';
import { createWeeklyAssignments } from './handlers/create_weekly_assignments';
import { getAssignmentsByWeek } from './handlers/get_assignments_by_week';
import { getAssignmentsByParticipant } from './handlers/get_assignments_by_participant';
import { completeAssignment } from './handlers/complete_assignment';
import { getCurrentWeekAssignments } from './handlers/get_current_week_assignments';
import { getWeeksWithAssignments } from './handlers/get_weeks_with_assignments';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Participant management
  createParticipant: publicProcedure
    .input(createParticipantInputSchema)
    .mutation(({ input }) => createParticipant(input)),

  getParticipants: publicProcedure
    .query(() => getParticipants()),

  updateParticipant: publicProcedure
    .input(updateParticipantInputSchema)
    .mutation(({ input }) => updateParticipant(input)),

  deleteParticipant: publicProcedure
    .input(deleteParticipantInputSchema)
    .mutation(({ input }) => deleteParticipant(input)),

  // Chore management
  createChore: publicProcedure
    .input(createChoreInputSchema)
    .mutation(({ input }) => createChore(input)),

  getChores: publicProcedure
    .query(() => getChores()),

  updateChore: publicProcedure
    .input(updateChoreInputSchema)
    .mutation(({ input }) => updateChore(input)),

  deleteChore: publicProcedure
    .input(deleteChoreInputSchema)
    .mutation(({ input }) => deleteChore(input)),

  // Assignment management
  createWeeklyAssignments: publicProcedure
    .input(createWeeklyAssignmentInputSchema)
    .mutation(({ input }) => createWeeklyAssignments(input)),

  getAssignmentsByWeek: publicProcedure
    .input(getAssignmentsByWeekInputSchema)
    .query(({ input }) => getAssignmentsByWeek(input)),

  getAssignmentsByParticipant: publicProcedure
    .input(getAssignmentsByParticipantInputSchema)
    .query(({ input }) => getAssignmentsByParticipant(input)),

  getCurrentWeekAssignments: publicProcedure
    .query(() => getCurrentWeekAssignments()),

  completeAssignment: publicProcedure
    .input(completeAssignmentInputSchema)
    .mutation(({ input }) => completeAssignment(input)),

  // History and tracking
  getWeeksWithAssignments: publicProcedure
    .query(() => getWeeksWithAssignments()),
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
