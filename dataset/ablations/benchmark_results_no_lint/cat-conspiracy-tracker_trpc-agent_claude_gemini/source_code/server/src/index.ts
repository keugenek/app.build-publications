import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCatInputSchema, 
  createActivityInputSchema,
  getDailyConspiracyInputSchema 
} from './schema';

// Import handlers
import { createCat } from './handlers/create_cat';
import { getCats } from './handlers/get_cats';
import { createActivity } from './handlers/create_activity';
import { getActivities } from './handlers/get_activities';
import { getDailyConspiracyLevel } from './handlers/get_daily_conspiracy_level';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Cat management routes
  createCat: publicProcedure
    .input(createCatInputSchema)
    .mutation(({ input }) => createCat(input)),

  getCats: publicProcedure
    .query(() => getCats()),

  // Activity logging routes
  createActivity: publicProcedure
    .input(createActivityInputSchema)
    .mutation(({ input }) => createActivity(input)),

  getActivities: publicProcedure
    .input(z.object({ catId: z.number().optional() }))
    .query(({ input }) => getActivities(input.catId)),

  // Conspiracy level analysis route
  getDailyConspiracyLevel: publicProcedure
    .input(getDailyConspiracyInputSchema)
    .query(({ input }) => getDailyConspiracyLevel(input)),
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
  console.log(`🐱 Cat Conspiracy Tracker TRPC server listening at port: ${port}`);
  console.log(`Ready to log suspicious feline activities and calculate conspiracy levels!`);
}

start();
