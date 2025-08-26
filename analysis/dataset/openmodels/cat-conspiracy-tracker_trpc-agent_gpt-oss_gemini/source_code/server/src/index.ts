import { initTRPC } from '@trpc/server';
import { createCatInputSchema, createActivityInputSchema } from './schema';
import { createCat } from './handlers/create_cat';
import { getCats } from './handlers/get_cats';
import { createActivity } from './handlers/create_activity';
import { getActivities } from './handlers/get_activities';
import { getDailyConspiracy } from './handlers/get_daily_conspiracy';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Cat routes
  createCat: publicProcedure
    .input(createCatInputSchema)
    .mutation(({ input }) => createCat(input)),
  getCats: publicProcedure.query(() => getCats()),
  // Activity routes
  createActivity: publicProcedure
    .input(createActivityInputSchema)
    .mutation(({ input }) => createActivity(input)),
  getActivities: publicProcedure.query(() => getActivities()),
  // Daily conspiracy routes
  getDailyConspiracy: publicProcedure.query(() => getDailyConspiracy()),

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
