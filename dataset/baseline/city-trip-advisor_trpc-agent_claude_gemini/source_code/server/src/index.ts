import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { tripSuggestionInputSchema, createTripHistoryInputSchema } from './schema';
import { getTripSuggestion } from './handlers/get_trip_suggestion';
import { saveTripHistory } from './handlers/save_trip_history';
import { getTripHistory } from './handlers/get_trip_history';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Get trip suggestion for a city based on tomorrow's weather
  getTripSuggestion: publicProcedure
    .input(tripSuggestionInputSchema)
    .query(({ input }) => getTripSuggestion(input)),
  
  // Save trip history record
  saveTripHistory: publicProcedure
    .input(createTripHistoryInputSchema)
    .mutation(({ input }) => saveTripHistory(input)),
  
  // Get all trip history records
  getTripHistory: publicProcedure
    .query(() => getTripHistory()),
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
