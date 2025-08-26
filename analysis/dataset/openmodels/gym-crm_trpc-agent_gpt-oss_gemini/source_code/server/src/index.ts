import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import {
  createClassInputSchema,
  createMemberInputSchema,
  createBookingInputSchema,
  updateClassInputSchema,
} from './schema';

// Import handler implementations (placeholders)
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { createMember } from './handlers/create_member';
import { getMembers } from './handlers/get_members';
import { createBooking } from './handlers/create_booking';
import { getBookings } from './handlers/get_bookings';
import { updateClass } from './handlers/update_class';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Class routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  getClasses: publicProcedure.query(() => getClasses()),
  // Member routes
  createMember: publicProcedure
    .input(createMemberInputSchema)
    .mutation(({ input }) => createMember(input)),
  getMembers: publicProcedure.query(() => getMembers()),
  // Booking routes
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),
  getBookings: publicProcedure.query(() => getBookings()),
  // Update class route
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),
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
