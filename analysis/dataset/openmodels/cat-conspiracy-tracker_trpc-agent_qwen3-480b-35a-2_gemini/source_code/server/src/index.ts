import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createCatInputSchema,
  updateCatInputSchema,
  recordBehaviorInputSchema,
  getConspiracyLevelsInputSchema
} from './schema';

// Import handlers
import { createCat } from './handlers/create_cat';
import { updateCat } from './handlers/update_cat';
import { getCats } from './handlers/get_cats';
import { recordBehavior } from './handlers/record_behavior';
import { getBehaviors } from './handlers/get_behaviors';
import { getConspiracyLevels } from './handlers/get_conspiracy_levels';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createCat: publicProcedure
    .input(createCatInputSchema)
    .mutation(({ input }) => createCat(input)),
  updateCat: publicProcedure
    .input(updateCatInputSchema)
    .mutation(({ input }) => updateCat(input)),
  getCats: publicProcedure
    .query(() => getCats()),
  recordBehavior: publicProcedure
    .input(recordBehaviorInputSchema)
    .mutation(({ input }) => recordBehavior(input)),
  getBehaviors: publicProcedure
    .query(() => getBehaviors()),
  getConspiracyLevels: publicProcedure
    .input(getConspiracyLevelsInputSchema)
    .query(({ input }) => getConspiracyLevels(input)),
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
