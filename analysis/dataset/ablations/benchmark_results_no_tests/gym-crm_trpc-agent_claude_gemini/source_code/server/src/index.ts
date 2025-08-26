import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createMemberInputSchema,
  updateMemberInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  getScheduleInputSchema,
  createBookingInputSchema,
  updateBookingInputSchema
} from './schema';

// Import handlers
import { createMember } from './handlers/create_member';
import { getMembers } from './handlers/get_members';
import { updateMember } from './handlers/update_member';
import { getMemberById } from './handlers/get_member_by_id';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { updateClass } from './handlers/update_class';
import { getClassById } from './handlers/get_class_by_id';
import { getSchedule } from './handlers/get_schedule';
import { createBooking } from './handlers/create_booking';
import { cancelBooking } from './handlers/cancel_booking';
import { getMemberBookings } from './handlers/get_member_bookings';
import { updateBookingStatus } from './handlers/update_booking_status';
import { getClassAttendance } from './handlers/get_class_attendance';

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

  // Member management
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),

  getMembers: publicProcedure
    .query(() => getMembers()),

  getMemberById: publicProcedure
    .input(z.number())
    .query(({ input }) => getMemberById(input)),

  updateMember: publicProcedure
    .input(updateMemberInputSchema)
    .mutation(({ input }) => updateMember(input)),

  // Class management
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),

  getClasses: publicProcedure
    .query(() => getClasses()),

  getClassById: publicProcedure
    .input(z.number())
    .query(({ input }) => getClassById(input)),

  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),

  // Schedule and booking
  getSchedule: publicProcedure
    .input(getScheduleInputSchema)
    .query(({ input }) => getSchedule(input)),

  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),

  cancelBooking: publicProcedure
    .input(z.number())
    .mutation(({ input }) => cancelBooking(input)),

  getMemberBookings: publicProcedure
    .input(z.number())
    .query(({ input }) => getMemberBookings(input)),

  updateBookingStatus: publicProcedure
    .input(updateBookingInputSchema)
    .mutation(({ input }) => updateBookingStatus(input)),

  // Attendance tracking
  getClassAttendance: publicProcedure
    .input(z.number())
    .query(({ input }) => getClassAttendance(input)),
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
  console.log(`Gym CRM TRPC server listening at port: ${port}`);
}

start();
