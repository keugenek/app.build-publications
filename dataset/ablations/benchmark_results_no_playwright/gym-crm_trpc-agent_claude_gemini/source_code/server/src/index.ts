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
  getMembersInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  createClassScheduleInputSchema,
  updateClassScheduleInputSchema,
  getClassSchedulesInputSchema,
  createBookingInputSchema,
  updateBookingInputSchema,
  getBookingsInputSchema
} from './schema';

// Import handlers
import { createMember } from './handlers/create_member';
import { getMembers } from './handlers/get_members';
import { updateMember } from './handlers/update_member';
import { deleteMember } from './handlers/delete_member';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { updateClass } from './handlers/update_class';
import { deleteClass } from './handlers/delete_class';
import { createClassSchedule } from './handlers/create_class_schedule';
import { getClassSchedules } from './handlers/get_class_schedules';
import { updateClassSchedule } from './handlers/update_class_schedule';
import { deleteClassSchedule } from './handlers/delete_class_schedule';
import { getCalendarView } from './handlers/get_calendar_view';
import { createBooking } from './handlers/create_booking';
import { getBookings } from './handlers/get_bookings';
import { cancelBooking } from './handlers/cancel_booking';
import { markAttendance } from './handlers/mark_attendance';
import { getMemberBookings } from './handlers/get_member_bookings';
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

  // Member management routes
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),

  getMembers: publicProcedure
    .input(getMembersInputSchema.optional())
    .query(({ input }) => getMembers(input)),

  updateMember: publicProcedure
    .input(updateMemberInputSchema)
    .mutation(({ input }) => updateMember(input)),

  deleteMember: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMember(input.id)),

  // Class management routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),

  getClasses: publicProcedure
    .query(() => getClasses()),

  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),

  deleteClass: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteClass(input.id)),

  // Class schedule management routes
  createClassSchedule: publicProcedure
    .input(createClassScheduleInputSchema)
    .mutation(({ input }) => createClassSchedule(input)),

  getClassSchedules: publicProcedure
    .input(getClassSchedulesInputSchema.optional())
    .query(({ input }) => getClassSchedules(input)),

  updateClassSchedule: publicProcedure
    .input(updateClassScheduleInputSchema)
    .mutation(({ input }) => updateClassSchedule(input)),

  deleteClassSchedule: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteClassSchedule(input.id)),

  // Calendar view route
  getCalendarView: publicProcedure
    .input(z.object({
      dateFrom: z.coerce.date(),
      dateTo: z.coerce.date()
    }))
    .query(({ input }) => getCalendarView(input.dateFrom, input.dateTo)),

  // Booking management routes
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),

  getBookings: publicProcedure
    .input(getBookingsInputSchema.optional())
    .query(({ input }) => getBookings(input)),

  cancelBooking: publicProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(({ input }) => cancelBooking(input.bookingId)),

  // Attendance management routes
  markAttendance: publicProcedure
    .input(z.object({
      bookingId: z.number(),
      attended: z.boolean()
    }))
    .mutation(({ input }) => markAttendance(input.bookingId, input.attended)),

  // Member-specific routes
  getMemberBookings: publicProcedure
    .input(z.object({ memberId: z.number() }))
    .query(({ input }) => getMemberBookings(input.memberId)),

  // Class attendance routes
  getClassAttendance: publicProcedure
    .input(z.object({ classScheduleId: z.number() }))
    .query(({ input }) => getClassAttendance(input.classScheduleId)),
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
