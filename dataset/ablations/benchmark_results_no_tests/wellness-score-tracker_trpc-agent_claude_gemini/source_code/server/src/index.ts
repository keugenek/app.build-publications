import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createWellnessEntryInputSchema,
  updateWellnessEntryInputSchema,
  getWellnessEntriesInputSchema,
  getWellnessEntryInputSchema,
  deleteWellnessEntryInputSchema
} from './schema';

// Import handlers
import { createWellnessEntry } from './handlers/create_wellness_entry';
import { updateWellnessEntry } from './handlers/update_wellness_entry';
import { getWellnessEntries } from './handlers/get_wellness_entries';
import { getWellnessEntry } from './handlers/get_wellness_entry';
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
  
  // Update an existing wellness entry
  updateWellnessEntry: publicProcedure
    .input(updateWellnessEntryInputSchema)
    .mutation(({ input }) => updateWellnessEntry(input)),
  
  // Get wellness entries for a user (with optional date filtering)
  getWellnessEntries: publicProcedure
    .input(getWellnessEntriesInputSchema)
    .query(({ input }) => getWellnessEntries(input)),
  
  // Get a single wellness entry by ID
  getWellnessEntry: publicProcedure
    .input(getWellnessEntryInputSchema)
    .query(({ input }) => getWellnessEntry(input)),
  
  // Delete a wellness entry
  deleteWellnessEntry: publicProcedure
    .input(deleteWellnessEntryInputSchema)
    .mutation(({ input }) => deleteWellnessEntry(input)),
  
  // Get wellness trends data for analytics and charts
  getWellnessTrends: publicProcedure
    .input(getWellnessEntriesInputSchema)
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
  console.log(`TRPC server listening at port: ${port}`);
}

start();
