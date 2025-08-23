import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schemas
import { 
  createMemberInputSchema,
  createInstructorInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  createReservationInputSchema,
  cancelReservationInputSchema
} from './schema';

// Handlers
import { createMember } from './handlers/create_member';
import { getMembers } from './handlers/get_members';
import { createInstructor } from './handlers/create_instructor';
import { getInstructors } from './handlers/get_instructors';
import { createClass } from './handlers/create_class';
import { updateClass } from './handlers/update_class';
import { getClasses, getUpcomingClasses } from './handlers/get_classes';
import { deleteClass } from './handlers/delete_class';
import { createReservation } from './handlers/create_reservation';
import { cancelReservation } from './handlers/cancel_reservation';
import { getReservations, getClassReservations, getMemberReservations } from './handlers/get_reservations';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Member routes
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
  getMembers: publicProcedure
    .query(() => getMembers()),
    
  // Instructor routes
  createInstructor: publicProcedure
    .input(createInstructorInputSchema)
    .mutation(({ input }) => createInstructor(input)),
  getInstructors: publicProcedure
    .query(() => getInstructors()),
    
  // Class routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),
  getClasses: publicProcedure
    .query(() => getClasses()),
  getUpcomingClasses: publicProcedure
    .query(() => getUpcomingClasses()),
  deleteClass: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteClass(input)),
    
  // Reservation routes
  createReservation: publicProcedure
    .input(createReservationInputSchema)
    .mutation(({ input }) => createReservation(input)),
  cancelReservation: publicProcedure
    .input(cancelReservationInputSchema)
    .mutation(({ input }) => cancelReservation(input)),
  getReservations: publicProcedure
    .query(() => getReservations()),
  getClassReservations: publicProcedure
    .input(z.number())
    .query(({ input }) => getClassReservations(input)),
  getMemberReservations: publicProcedure
    .input(z.number())
    .query(({ input }) => getMemberReservations(input)),
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
