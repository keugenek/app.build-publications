import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createCatProfileInputSchema,
  logCatActivityInputSchema,
  getActivitiesByDateRangeInputSchema,
  getDailySummaryInputSchema
} from './schema';

// Import handlers
import { createCatProfile } from './handlers/create_cat_profile';
import { getCatProfiles } from './handlers/get_cat_profiles';
import { logCatActivity } from './handlers/log_cat_activity';
import { getCatActivities } from './handlers/get_cat_activities';
import { getDailyConspiracyReport } from './handlers/get_daily_conspiracy_report';

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
      message: 'Cat Conspiracy Tracker API is operational. Keep watching your feline overlords!' 
    };
  }),

  // Cat profile management
  createCatProfile: publicProcedure
    .input(createCatProfileInputSchema)
    .mutation(({ input }) => createCatProfile(input)),

  getCatProfiles: publicProcedure
    .query(() => getCatProfiles()),

  // Activity logging
  logCatActivity: publicProcedure
    .input(logCatActivityInputSchema)
    .mutation(({ input }) => logCatActivity(input)),

  // Activity retrieval
  getCatActivities: publicProcedure
    .input(getActivitiesByDateRangeInputSchema)
    .query(({ input }) => getCatActivities(input)),

  // Daily conspiracy reports
  getDailyConspiracyReport: publicProcedure
    .input(getDailySummaryInputSchema)
    .query(({ input }) => getDailyConspiracyReport(input)),

  // Get today's conspiracy report (convenience endpoint)
  getTodaysConspiracyReport: publicProcedure
    .input(getDailySummaryInputSchema.pick({ cat_id: true }))
    .query(({ input }) => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      return getDailyConspiracyReport({ cat_id: input.cat_id, date: today });
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
  console.log(`🐱 Cat Conspiracy Tracker TRPC server listening at port: ${port}`);
  console.log(`🔍 Ready to monitor suspicious feline activities...`);
}

start();
