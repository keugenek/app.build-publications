import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schema imports
import { 
  createKanjiInputSchema, 
  jlptLevelSchema,
  createSRSEntryInputSchema,
  updateSRSEntryInputSchema
} from './schema';

// Handler imports
import { createKanji } from './handlers/create_kanji';
import { getKanji, getKanjiById } from './handlers/get_kanji';
import { createSRSEntry } from './handlers/create_srs_entry';
import { getDueKanji } from './handlers/get_due_kanji';
import { updateSRSEntry } from './handlers/update_srs_entry';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Kanji routes
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),
  getKanji: publicProcedure
    .input(z.object({ jlptLevel: jlptLevelSchema.optional() }))
    .query(({ input }) => getKanji(input.jlptLevel)),
  getKanjiById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getKanjiById(input.id)),
  // SRS routes
  createSRSEntry: publicProcedure
    .input(createSRSEntryInputSchema)
    .mutation(({ input }) => createSRSEntry(input)),
  getDueKanji: publicProcedure
    .input(z.object({ 
      userId: z.string(),
      jlptLevel: jlptLevelSchema.optional()
    }))
    .query(({ input }) => getDueKanji(input.userId, input.jlptLevel)),
  updateSRSEntry: publicProcedure
    .input(updateSRSEntryInputSchema)
    .mutation(({ input }) => updateSRSEntry(input)),
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