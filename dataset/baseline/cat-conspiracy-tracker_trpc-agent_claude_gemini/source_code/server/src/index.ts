import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createBehaviorTypeInputSchema,
  updateBehaviorTypeInputSchema,
  createCatActivityInputSchema,
  updateCatActivityInputSchema,
  getActivitiesByDateRangeInputSchema,
  getConspiracyLevelsByDateRangeInputSchema,
  getDailyConspiracyLevelInputSchema
} from './schema';

// Import handlers
import { createBehaviorType } from './handlers/create_behavior_type';
import { getBehaviorTypes } from './handlers/get_behavior_types';
import { updateBehaviorType } from './handlers/update_behavior_type';
import { deleteBehaviorType } from './handlers/delete_behavior_type';
import { createCatActivity } from './handlers/create_cat_activity';
import { getCatActivities } from './handlers/get_cat_activities';
import { getActivitiesByDateRange } from './handlers/get_activities_by_date_range';
import { updateCatActivity } from './handlers/update_cat_activity';
import { deleteCatActivity } from './handlers/delete_cat_activity';
import { getDailyConspiracyLevel } from './handlers/get_daily_conspiracy_level';
import { getConspiracyLevelsByDateRange } from './handlers/get_conspiracy_levels_by_date_range';
import { calculateDailyConspiracyLevel } from './handlers/calculate_daily_conspiracy_level';
import { seedDefaultBehaviorTypes } from './handlers/seed_default_behavior_types';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Behavior Type routes
  createBehaviorType: publicProcedure
    .input(createBehaviorTypeInputSchema)
    .mutation(({ input }) => createBehaviorType(input)),

  getBehaviorTypes: publicProcedure
    .query(() => getBehaviorTypes()),

  updateBehaviorType: publicProcedure
    .input(updateBehaviorTypeInputSchema)
    .mutation(({ input }) => updateBehaviorType(input)),

  deleteBehaviorType: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBehaviorType(input.id)),

  seedDefaultBehaviorTypes: publicProcedure
    .mutation(() => seedDefaultBehaviorTypes()),

  // Cat Activity routes
  createCatActivity: publicProcedure
    .input(createCatActivityInputSchema)
    .mutation(({ input }) => createCatActivity(input)),

  getCatActivities: publicProcedure
    .query(() => getCatActivities()),

  getActivitiesByDateRange: publicProcedure
    .input(getActivitiesByDateRangeInputSchema)
    .query(({ input }) => getActivitiesByDateRange(input)),

  updateCatActivity: publicProcedure
    .input(updateCatActivityInputSchema)
    .mutation(({ input }) => updateCatActivity(input)),

  deleteCatActivity: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCatActivity(input.id)),

  // Conspiracy Level routes
  getDailyConspiracyLevel: publicProcedure
    .input(getDailyConspiracyLevelInputSchema)
    .query(({ input }) => getDailyConspiracyLevel(input)),

  getCurrentDayConspiracyLevel: publicProcedure
    .query(() => getDailyConspiracyLevel({ date: new Date() })),

  getConspiracyLevelsByDateRange: publicProcedure
    .input(getConspiracyLevelsByDateRangeInputSchema)
    .query(({ input }) => getConspiracyLevelsByDateRange(input)),

  calculateDailyConspiracyLevel: publicProcedure
    .input(z.object({ date: z.coerce.date() }))
    .mutation(({ input }) => calculateDailyConspiracyLevel(input.date)),
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
  console.log(`🐱 Catspiracy Tracker TRPC server listening at port: ${port}`);
}

start();
