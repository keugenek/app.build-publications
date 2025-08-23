import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createActivityEntryInputSchema, updateActivityEntryInputSchema } from './schema';
import { createActivityEntry } from './handlers/create_activity_entry';
import { getActivityEntries } from './handlers/get_activity_entries';
import { getActivityEntry } from './handlers/get_activity_entry';
import { getSuggestions } from './handlers/get_suggestions';
import { getStatistics } from './handlers/get_statistics';
import { updateActivityEntry } from './handlers/update_activity_entry';
import { deleteActivityEntry } from './handlers/delete_activity_entry';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createActivityEntry: publicProcedure
    .input(createActivityEntryInputSchema)
    .mutation(({ input }) => createActivityEntry(input)),
  updateActivityEntry: publicProcedure
    .input(updateActivityEntryInputSchema)
    .mutation(({ input }) => updateActivityEntry(input)),
  deleteActivityEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteActivityEntry(input.id)),
  getActivityEntries: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getActivityEntries(input.userId)),
  getActivityEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getActivityEntry(input.id)),
  getSuggestions: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getSuggestions(input.userId)),
  getStatistics: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getStatistics(input.userId)),
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
