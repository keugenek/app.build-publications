import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCatInputSchema,
  createActivityTypeInputSchema,
  logSuspiciousActivityInputSchema,
  getConspiracyLevelInputSchema
} from './schema';

// Import handlers
import { createCat } from './handlers/create_cat';
import { getCats } from './handlers/get_cats';
import { createActivityType } from './handlers/create_activity_type';
import { getActivityTypes } from './handlers/get_activity_types';
import { logSuspiciousActivity } from './handlers/log_suspicious_activity';
import { getSuspiciousActivities } from './handlers/get_suspicious_activities';
import { getDailyConspiracyLevel } from './handlers/get_daily_conspiracy_level';
import { seedDefaultActivities } from './handlers/seed_default_activities';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Feline Conspiracy Tracker API is operational. All cats are under surveillance.' 
    };
  }),

  // Cat management endpoints
  createCat: publicProcedure
    .input(createCatInputSchema)
    .mutation(({ input }) => createCat(input)),

  getCats: publicProcedure
    .query(() => getCats()),

  // Activity type management endpoints
  createActivityType: publicProcedure
    .input(createActivityTypeInputSchema)
    .mutation(({ input }) => createActivityType(input)),

  getActivityTypes: publicProcedure
    .query(() => getActivityTypes()),

  seedDefaultActivities: publicProcedure
    .mutation(() => seedDefaultActivities()),

  // Suspicious activity logging endpoints
  logSuspiciousActivity: publicProcedure
    .input(logSuspiciousActivityInputSchema)
    .mutation(({ input }) => logSuspiciousActivity(input)),

  getSuspiciousActivities: publicProcedure
    .input(z.object({
      catId: z.number().optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    }))
    .query(({ input }) => getSuspiciousActivities(input.catId, input.date)),

  // Conspiracy level calculation endpoint
  getDailyConspiracyLevel: publicProcedure
    .input(getConspiracyLevelInputSchema)
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
  console.log(`🐱 Feline Conspiracy Tracker TRPC server listening at port: ${port}`);
  console.log(`📊 Ready to monitor suspicious cat activities and calculate daily conspiracy levels!`);
}

start();
