import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { createKanjiInputSchema, recordReviewInputSchema } from './schema';
import { createKanji } from './handlers/create_kanji';
import { getKanjis } from './handlers/get_kanjis';
import { recordReview } from './handlers/record_review';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Create a new kanji entry
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),
  // Fetch all kanjis
  getKanjis: publicProcedure.query(() => getKanjis()),
  // Record a review result for SRS
  recordReview: publicProcedure
    .input(recordReviewInputSchema)
    .mutation(({ input }) => recordReview(input)),
  // Simple healthcheck endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
