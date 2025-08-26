import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  createClassScheduleInputSchema,
  updateClassScheduleInputSchema,
  createBookingInputSchema,
  updateBookingStatusInputSchema,
  getClassSchedulesQuerySchema,
  getUserBookingsQuerySchema,
  getClassAttendanceQuerySchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { updateClass } from './handlers/update_class';
import { deleteClass } from './handlers/delete_class';
import { createClassSchedule } from './handlers/create_class_schedule';
import { getClassSchedules } from './handlers/get_class_schedules';
import { updateClassSchedule } from './handlers/update_class_schedule';
import { createBooking } from './handlers/create_booking';
import { getUserBookings } from './handlers/get_user_bookings';
import { cancelBooking } from './handlers/cancel_booking';
import { getClassAttendance } from './handlers/get_class_attendance';
import { updateBookingStatus } from './handlers/update_booking_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Class management routes (admin only)
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
    .input(getClassSchedulesQuerySchema.optional())
    .query(({ input }) => getClassSchedules(input)),
  
  updateClassSchedule: publicProcedure
    .input(updateClassScheduleInputSchema)
    .mutation(({ input }) => updateClassSchedule(input)),

  // Booking management routes
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),
  
  getUserBookings: publicProcedure
    .input(getUserBookingsQuerySchema)
    .query(({ input }) => getUserBookings(input)),
  
  cancelBooking: publicProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(({ input }) => cancelBooking(input.bookingId)),

  // Attendance tracking routes (admin only)
  getClassAttendance: publicProcedure
    .input(getClassAttendanceQuerySchema)
    .query(({ input }) => getClassAttendance(input)),
  
  updateBookingStatus: publicProcedure
    .input(updateBookingStatusInputSchema)
    .mutation(({ input }) => updateBookingStatus(input)),
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
