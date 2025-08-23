import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { getBeerCount } from './handlers/get_beer_count';
import { updateBeerCount } from './handlers/update_beer_count';
import { updateBeerCounterInputSchema } from './schema';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check route
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Get current beer count
  getBeerCount: publicProcedure.query(() => getBeerCount()),
  // Update beer count (increment, decrement, reset)
  updateBeerCount: publicProcedure
    .input(updateBeerCounterInputSchema)
    .mutation(({ input }) => updateBeerCount(input)),
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
