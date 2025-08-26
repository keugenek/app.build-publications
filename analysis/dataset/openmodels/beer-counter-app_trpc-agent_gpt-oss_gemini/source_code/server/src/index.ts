import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { changeAmountInputSchema } from './schema';
import { getBeerCount } from './handlers/get_beer_count';
import { incrementBeer } from './handlers/increment_beer';
import { decrementBeer } from './handlers/decrement_beer';
import { resetBeer } from './handlers/reset_beer';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Get current beer count
  getBeerCount: publicProcedure.query(() => getBeerCount()),
  // Increment beer count
  incrementBeer: publicProcedure
    .input(changeAmountInputSchema)
    .mutation(({ input }) => incrementBeer(input)),
  // Decrement beer count
  decrementBeer: publicProcedure
    .input(changeAmountInputSchema)
    .mutation(({ input }) => decrementBeer(input)),
  // Reset beer count
  resetBeer: publicProcedure.mutation(() => resetBeer()),
  // Healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
