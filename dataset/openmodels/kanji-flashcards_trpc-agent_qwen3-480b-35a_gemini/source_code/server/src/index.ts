import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createKanjiInputSchema,
  getKanjiByLevelInputSchema,
  createFlashcardInputSchema,
  reviewFlashcardInputSchema
} from './schema';

// Import handlers
import { createKanji } from './handlers/create_kanji';
import { getKanjiByLevel } from './handlers/get_kanji_by_level';
import { createFlashcard } from './handlers/create_flashcard';
import { reviewFlashcard } from './handlers/review_flashcard';
import { getFlashcardsForReview } from './handlers/get_flashcards_for_review';
import { getUserProgress } from './handlers/get_user_progress';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Kanji management
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),
    
  getKanjiByLevel: publicProcedure
    .input(getKanjiByLevelInputSchema)
    .query(({ input }) => getKanjiByLevel(input)),
    
  // Flashcard SRS system
  createFlashcard: publicProcedure
    .input(createFlashcardInputSchema)
    .mutation(({ input }) => createFlashcard(input)),
    
  reviewFlashcard: publicProcedure
    .input(reviewFlashcardInputSchema)
    .mutation(({ input }) => reviewFlashcard(input)),
    
  getFlashcardsForReview: publicProcedure
    .input(z.string())
    .query(({ input: userId }) => getFlashcardsForReview(userId)),
    
  // User progress tracking
  getUserProgress: publicProcedure
    .input(z.string())
    .query(({ input: userId }) => getUserProgress(userId)),
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
