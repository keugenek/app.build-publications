import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createKanjiInputSchema } from './schema';
import { createKanji } from './handlers/create_kanji';
import { getKanji } from './handlers/get_kanji';
import { createSrsEntryInputSchema } from './schema';
import { createSrsEntry } from './handlers/create_srs_entry';
import { updateSrsEntryInputSchema } from './schema';
import { updateSrsEntry } from './handlers/update_srs_entry';
import { getFlashcards } from './handlers/get_flashcards';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),
  getKanji: publicProcedure
    .query(() => getKanji()),
  createSrsEntry: publicProcedure
    .input(createSrsEntryInputSchema)
    .mutation(({ input }) => createSrsEntry(input)),
  updateSrsEntry: publicProcedure
    .input(updateSrsEntryInputSchema)
    .mutation(({ input }) => updateSrsEntry(input)),
  getFlashcards: publicProcedure
    .query(() => getFlashcards()),
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
