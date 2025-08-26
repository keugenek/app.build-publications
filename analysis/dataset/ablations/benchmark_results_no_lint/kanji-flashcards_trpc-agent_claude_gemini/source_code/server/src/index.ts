import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createKanjiInputSchema,
  updateKanjiInputSchema,
  answerFlashcardInputSchema,
  getDueReviewsInputSchema,
  jlptLevelSchema
} from './schema';

// Import handlers
import { createKanji } from './handlers/create_kanji';
import { getAllKanji, getKanjiByLevel, getKanjiById } from './handlers/get_kanji';
import { updateKanji, deleteKanji } from './handlers/update_kanji';
import { answerFlashcard } from './handlers/answer_flashcard';
import { getDueReviews, getUserProgress } from './handlers/get_due_reviews';

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

  // Kanji management endpoints
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),

  getAllKanji: publicProcedure
    .query(() => getAllKanji()),

  getKanjiByLevel: publicProcedure
    .input(z.object({ jlptLevel: jlptLevelSchema }))
    .query(({ input }) => getKanjiByLevel(input.jlptLevel)),

  getKanjiById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getKanjiById(input.id)),

  updateKanji: publicProcedure
    .input(updateKanjiInputSchema)
    .mutation(({ input }) => updateKanji(input)),

  deleteKanji: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteKanji(input.id)),

  // Flashcard and SRS endpoints
  answerFlashcard: publicProcedure
    .input(answerFlashcardInputSchema)
    .mutation(({ input }) => answerFlashcard(input)),

  getDueReviews: publicProcedure
    .input(getDueReviewsInputSchema)
    .query(({ input }) => getDueReviews(input)),

  getUserProgress: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserProgress(input.userId)),
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
