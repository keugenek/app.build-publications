import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createWellnessEntryInputSchema, 
  updateWellnessEntryInputSchema,
  getWellnessEntriesInputSchema 
} from './schema';

// Import handlers
import { createWellnessEntry } from './handlers/create_wellness_entry';
import { getWellnessEntries } from './handlers/get_wellness_entries';
import { getWellnessEntryById } from './handlers/get_wellness_entry_by_id';
import { updateWellnessEntry } from './handlers/update_wellness_entry';
import { deleteWellnessEntry } from './handlers/delete_wellness_entry';
import { getWellnessTrends } from './handlers/get_wellness_trends';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new wellness entry
  createWellnessEntry: publicProcedure
    .input(createWellnessEntryInputSchema)
    .mutation(({ input }) => createWellnessEntry(input)),

  // Get wellness entries with optional filtering
  getWellnessEntries: publicProcedure
    .input(getWellnessEntriesInputSchema.optional())
    .query(({ input }) => getWellnessEntries(input)),

  // Get a single wellness entry by ID
  getWellnessEntryById: publicProcedure
    .input(z.number().int().positive())
    .query(({ input }) => getWellnessEntryById(input)),

  // Update an existing wellness entry
  updateWellnessEntry: publicProcedure
    .input(updateWellnessEntryInputSchema)
    .mutation(({ input }) => updateWellnessEntry(input)),

  // Delete a wellness entry
  deleteWellnessEntry: publicProcedure
    .input(z.number().int().positive())
    .mutation(({ input }) => deleteWellnessEntry(input)),

  // Get wellness trends and analytics
  getWellnessTrends: publicProcedure
    .input(getWellnessEntriesInputSchema.optional())
    .query(({ input }) => getWellnessTrends(input)),
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
  console.log(`Wellness Tracking TRPC server listening at port: ${port}`);
}

start();
