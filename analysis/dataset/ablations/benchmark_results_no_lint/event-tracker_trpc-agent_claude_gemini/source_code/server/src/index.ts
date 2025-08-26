import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createEventInputSchema, 
  updateEventInputSchema, 
  deleteEventInputSchema 
} from './schema';

// Import handlers
import { createEvent } from './handlers/create_event';
import { getEvents } from './handlers/get_events';
import { updateEvent } from './handlers/update_event';
import { deleteEvent } from './handlers/delete_event';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Event management endpoints
  createEvent: publicProcedure
    .input(createEventInputSchema)
    .mutation(({ input }) => createEvent(input)),
    
  getEvents: publicProcedure
    .query(() => getEvents()),
    
  updateEvent: publicProcedure
    .input(updateEventInputSchema)
    .mutation(({ input }) => updateEvent(input)),
    
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
