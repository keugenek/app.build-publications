import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createKanjiInputSchema, updateKanjiInputSchema, createProgressInputSchema, updateProgressInputSchema } from './schema';
import { createKanji } from './handlers/create_kanji';
import { getKanjis } from './handlers/get_kanjis';
import { updateKanji } from './handlers/update_kanji';
import { createProgress } from './handlers/create_progress';
import { getProgresses } from './handlers/get_progress';
import { updateProgress } from './handlers/update_progress';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Kanji routes
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),
  getKanjis: publicProcedure.query(() => getKanjis()),
  updateKanji: publicProcedure
    .input(updateKanjiInputSchema)
    .mutation(({ input }) => updateKanji(input)),
  // Progress routes
  createProgress: publicProcedure
    .input(createProgressInputSchema)
    .mutation(({ input }) => createProgress(input)),
  getProgresses: publicProcedure.query(() => getProgresses()),
  updateProgress: publicProcedure
    .input(updateProgressInputSchema)
    .mutation(({ input }) => updateProgress(input)),
  // Existing healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  })
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
