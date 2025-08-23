import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createWellnessEntryInputSchema, updateWellnessEntryInputSchema } from './schema';
import { createWellnessEntry } from './handlers/create_wellness_entry';
import { getWellnessEntries } from './handlers/get_wellness_entries';
import { getWellnessTrends } from './handlers/get_wellness_trends';
import { updateWellnessEntry } from './handlers/update_wellness_entry';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createWellnessEntry: publicProcedure
    .input(createWellnessEntryInputSchema)
    .mutation(({ input }) => createWellnessEntry(input)),
  getWellnessEntries: publicProcedure
    .query(() => getWellnessEntries()),
  getWellnessTrends: publicProcedure
    .query(() => getWellnessTrends()),
  updateWellnessEntry: publicProcedure
    .input(updateWellnessEntryInputSchema)
    .mutation(({ input }) => updateWellnessEntry(input)),
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
