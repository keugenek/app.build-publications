import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { createWellnessEntryInputSchema, wellnessEntrySchema } from './schema';

// Import handlers
import { createWellnessEntry } from './handlers/create_wellness_entry';
import { getWellnessEntries } from './handlers/get_wellness_entries';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new wellness entry
  createWellnessEntry: publicProcedure
    .input(createWellnessEntryInputSchema)
    .mutation(({ input }) => createWellnessEntry(input)),
  
  // Get wellness entries for a user
  getWellnessEntries: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getWellnessEntries(input.userId)),
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
