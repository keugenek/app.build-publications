import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { tripSuggestionInputSchema, getTripSuggestionsInputSchema } from './schema';
import { createTripSuggestion } from './handlers/create_trip_suggestion';
import { getTripSuggestions } from './handlers/get_trip_suggestions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a trip suggestion for a given city
  createTripSuggestion: publicProcedure
    .input(tripSuggestionInputSchema)
    .mutation(({ input }) => createTripSuggestion(input)),
  
  // Get historical trip suggestions with optional filtering
  getTripSuggestions: publicProcedure
    .input(getTripSuggestionsInputSchema)
    .query(({ input }) => getTripSuggestions(input)),
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
