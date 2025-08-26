import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCounterInputSchema,
  incrementCounterInputSchema,
  decrementCounterInputSchema,
  resetCounterInputSchema
} from './schema';

// Import handlers
import { createCounter } from './handlers/create_counter';
import { getCounter } from './handlers/get_counter';
import { incrementCounter } from './handlers/increment_counter';
import { decrementCounter } from './handlers/decrement_counter';
import { resetCounter } from './handlers/reset_counter';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new beer counter
  createCounter: publicProcedure
    .input(createCounterInputSchema)
    .mutation(({ input }) => createCounter(input)),

  // Get counter by ID
  getCounter: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCounter(input.id)),

  // Increment beer count
  incrementCounter: publicProcedure
    .input(incrementCounterInputSchema)
    .mutation(({ input }) => incrementCounter(input)),

  // Decrement beer count
  decrementCounter: publicProcedure
    .input(decrementCounterInputSchema)
    .mutation(({ input }) => decrementCounter(input)),

  // Reset beer count to zero
  resetCounter: publicProcedure
    .input(resetCounterInputSchema)
    .mutation(({ input }) => resetCounter(input)),
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
