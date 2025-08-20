import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import { createEventInputSchema, deleteEventInputSchema } from './schema';

// Import handler implementations
import { createEvent } from './handlers/create_event';
import { getEvents } from './handlers/get_events';
import { deleteEvent } from './handlers/delete_event';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  // Healthcheck endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Create a new event
  createEvent: publicProcedure
    .input(createEventInputSchema)
    .mutation(({ input }) => createEvent(input)),
  // Retrieve all events
  getEvents: publicProcedure.query(() => getEvents()),
  // Delete an event by ID
  deleteEvent: publicProcedure
    .input(deleteEventInputSchema)
    .mutation(({ input }) => deleteEvent(input)),
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
