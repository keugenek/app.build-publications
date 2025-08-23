import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createWellnessEntryInputSchema } from './schema';
import { createWellnessEntry } from './handlers/create_wellness_entry';
import { getWellnessEntries } from './handlers/get_wellness_entries';
import { getWellnessEntry } from './handlers/get_wellness_entry';
import { updateWellnessEntryInputSchema } from './schema';
import { updateWellnessEntry } from './handlers/update_wellness_entry';
import { deleteWellnessEntry } from './handlers/delete_wellness_entry';

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
  getWellnessEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getWellnessEntry(input.id)),
  updateWellnessEntry: publicProcedure
    .input(updateWellnessEntryInputSchema)
    .mutation(({ input }) => updateWellnessEntry(input)),
  deleteWellnessEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteWellnessEntry(input.id)),
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
