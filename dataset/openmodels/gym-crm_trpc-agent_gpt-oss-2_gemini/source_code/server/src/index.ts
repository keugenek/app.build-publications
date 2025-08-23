import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createClassInputSchema,
  updateClassInputSchema,
  deleteClassInputSchema,
  classIdInputSchema,
  createMemberInputSchema,
  createReservationInputSchema,
  cancelReservationInputSchema,
  markAttendanceInputSchema,
} from './schema';

// Import handlers
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { updateClass } from './handlers/update_class';
import { deleteClass } from './handlers/delete_class';
import { createMember } from './handlers/create_member';
import { getMembers } from './handlers/get_members';
import { createReservation } from './handlers/create_reservation';
import { cancelReservation } from './handlers/cancel_reservation';
import { markAttendance } from './handlers/mark_attendance';
import { getMembersByClass } from './handlers/get_members_by_class';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck route
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Class routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  getClasses: publicProcedure.query(() => getClasses()),
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),
  deleteClass: publicProcedure
    .input(deleteClassInputSchema)
    .mutation(({ input }) => deleteClass(input)),

  // Member routes
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
  getMembers: publicProcedure.query(() => getMembers()),

  // Reservation routes
  createReservation: publicProcedure
    .input(createReservationInputSchema)
    .mutation(({ input }) => createReservation(input)),
  cancelReservation: publicProcedure
    .input(cancelReservationInputSchema)
    .mutation(({ input }) => cancelReservation(input)),
  markAttendance: publicProcedure
    .input(markAttendanceInputSchema)
    .mutation(({ input }) => markAttendance(input)),

  // Fetch members by class
  getMembersByClass: publicProcedure
    .input(classIdInputSchema)
    .query(({ input }) => getMembersByClass(input)),
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
