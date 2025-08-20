import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createEventInputSchema, deleteEventInputSchema } from './schema';
import { createEvent } from './handlers/create_event';
import { getEvents } from './handlers/get_events';
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
  
  createEvent: publicProcedure
    .input(createEventInputSchema)
    .mutation(({ input }) => createEvent(input)),
    
  getEvents: publicProcedure
    .query(() => getEvents()),
    
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
