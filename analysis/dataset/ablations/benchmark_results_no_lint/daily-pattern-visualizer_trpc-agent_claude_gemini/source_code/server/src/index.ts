import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createWellBeingEntryInputSchema,
  updateWellBeingEntryInputSchema,
  getWellBeingEntriesInputSchema
} from './schema';

// Import handlers
import { createWellBeingEntry } from './handlers/create_well_being_entry';
import { getWellBeingEntries } from './handlers/get_well_being_entries';
import { updateWellBeingEntry } from './handlers/update_well_being_entry';
import { deleteWellBeingEntry } from './handlers/delete_well_being_entry';
import { getWellnessSummary } from './handlers/get_wellness_summary';
import { getBreakSuggestions } from './handlers/get_break_suggestions';

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

  // Well-being entry management
  createWellBeingEntry: publicProcedure
    .input(createWellBeingEntryInputSchema)
    .mutation(({ input }) => createWellBeingEntry(input)),

  getWellBeingEntries: publicProcedure
    .input(getWellBeingEntriesInputSchema.optional())
    .query(({ input }) => getWellBeingEntries(input)),

  updateWellBeingEntry: publicProcedure
    .input(updateWellBeingEntryInputSchema)
    .mutation(({ input }) => updateWellBeingEntry(input)),

  deleteWellBeingEntry: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteWellBeingEntry(input)),

  // Analytics and insights
  getWellnessSummary: publicProcedure
    .input(z.enum(['daily', 'weekly', 'monthly']).default('weekly'))
    .query(({ input }) => getWellnessSummary(input)),

  getBreakSuggestions: publicProcedure
    .query(() => getBreakSuggestions()),
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
  console.log(`Personal Well-being Dashboard TRPC server listening at port: ${port}`);
}

start();
