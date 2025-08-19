import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  updateBeerCountInputSchema, 
  incrementBeerCountInputSchema, 
  decrementBeerCountInputSchema 
} from './schema';
import { getBeerCount } from './handlers/get_beer_count';
import { updateBeerCount } from './handlers/update_beer_count';
import { incrementBeerCount } from './handlers/increment_beer_count';
import { decrementBeerCount } from './handlers/decrement_beer_count';
import { resetBeerCount } from './handlers/reset_beer_count';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Get current beer count
  getBeerCount: publicProcedure
    .query(() => getBeerCount()),
  
  // Update beer count to a specific value
  updateBeerCount: publicProcedure
    .input(updateBeerCountInputSchema)
    .mutation(({ input }) => updateBeerCount(input)),
  
  // Increment beer count by specified amount (default 1)
  incrementBeerCount: publicProcedure
    .input(incrementBeerCountInputSchema)
    .mutation(({ input }) => incrementBeerCount(input)),
  
  // Decrement beer count by specified amount (default 1)
  decrementBeerCount: publicProcedure
    .input(decrementBeerCountInputSchema)
    .mutation(({ input }) => decrementBeerCount(input)),
  
  // Reset beer count to zero
  resetBeerCount: publicProcedure
    .mutation(() => resetBeerCount()),
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