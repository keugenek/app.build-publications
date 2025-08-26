import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import {
  createDailyMetricsInputSchema,
  getDailyMetricsInputSchema,
  getSuggestionsInputSchema,
} from './schema';
import { createDailyMetrics } from './handlers/create_daily_metrics';
import { getDailyMetrics } from './handlers/get_daily_metrics';
import { getSuggestions } from './handlers/get_suggestions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Create a new daily metrics entry
  createDailyMetrics: publicProcedure
    .input(createDailyMetricsInputSchema)
    .mutation(({ input }) => createDailyMetrics(input)),
  // Get daily metrics (optionally filtered by date range)
  getDailyMetrics: publicProcedure
    .input(getDailyMetricsInputSchema)
    .query(({ input }) => getDailyMetrics(input)),
  // Get suggestions based on thresholds
  getSuggestions: publicProcedure
    .input(getSuggestionsInputSchema)
    .query(({ input }) => getSuggestions(input)),
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
