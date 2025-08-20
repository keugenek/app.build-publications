import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  getUserByIdInputSchema,
  deleteEntityInputSchema,
  createInstructorInputSchema,
  updateInstructorInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  getClassByIdInputSchema,
  getClassesDateRangeInputSchema,
  createBookingInputSchema,
  updateBookingInputSchema,
  getBookingsByUserInputSchema,
  getBookingsByClassInputSchema,
  createAttendanceInputSchema,
  updateAttendanceInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { getUserById } from './handlers/get_user_by_id';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createInstructor } from './handlers/create_instructor';
import { getInstructors } from './handlers/get_instructors';
import { updateInstructor } from './handlers/update_instructor';
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { getClassById } from './handlers/get_class_by_id';
import { getClassesByDateRange } from './handlers/get_classes_by_date_range';
import { updateClass } from './handlers/update_class';
import { deleteClass } from './handlers/delete_class';
import { createBooking } from './handlers/create_booking';
import { getBookingsByUser } from './handlers/get_bookings_by_user';
import { getBookingsByClass } from './handlers/get_bookings_by_class';
import { updateBooking } from './handlers/update_booking';
import { cancelBooking } from './handlers/cancel_booking';
import { createAttendance } from './handlers/create_attendance';
import { getAttendanceByClass } from './handlers/get_attendance_by_class';
import { updateAttendance } from './handlers/update_attendance';

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

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
  getUserById: publicProcedure
    .input(getUserByIdInputSchema)
    .query(({ input }) => getUserById(input)),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  deleteUser: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  // Instructor management routes
  createInstructor: publicProcedure
    .input(createInstructorInputSchema)
    .mutation(({ input }) => createInstructor(input)),
  getInstructors: publicProcedure
    .query(() => getInstructors()),
  updateInstructor: publicProcedure
    .input(updateInstructorInputSchema)
    .mutation(({ input }) => updateInstructor(input)),

  // Class management routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  getClasses: publicProcedure
    .query(() => getClasses()),
  getClassById: publicProcedure
    .input(getClassByIdInputSchema)
    .query(({ input }) => getClassById(input)),
  getClassesByDateRange: publicProcedure
    .input(getClassesDateRangeInputSchema)
    .query(({ input }) => getClassesByDateRange(input)),
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),
  deleteClass: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteClass(input)),

  // Booking management routes
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),
  getBookingsByUser: publicProcedure
    .input(getBookingsByUserInputSchema)
    .query(({ input }) => getBookingsByUser(input)),
  getBookingsByClass: publicProcedure
    .input(getBookingsByClassInputSchema)
    .query(({ input }) => getBookingsByClass(input)),
  updateBooking: publicProcedure
    .input(updateBookingInputSchema)
    .mutation(({ input }) => updateBooking(input)),
  cancelBooking: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => cancelBooking(input)),

  // Attendance management routes
  createAttendance: publicProcedure
    .input(createAttendanceInputSchema)
    .mutation(({ input }) => createAttendance(input)),
  getAttendanceByClass: publicProcedure
    .input(getBookingsByClassInputSchema)
    .query(({ input }) => getAttendanceByClass(input)),
  updateAttendance: publicProcedure
    .input(updateAttendanceInputSchema)
    .mutation(({ input }) => updateAttendance(input)),
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
