import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createKanjiInputSchema,
  getKanjiQuerySchema,
  startKanjiStudyInputSchema,
  submitReviewInputSchema,
  getReviewsDueQuerySchema,
  getUserStatsQuerySchema,
  jlptLevelSchema
} from './schema';

// Import handlers
import { createKanji } from './handlers/create_kanji';
import { getKanji } from './handlers/get_kanji';
import { startKanjiStudy } from './handlers/start_kanji_study';
import { getReviewsDue } from './handlers/get_reviews_due';
import { submitReview } from './handlers/submit_review';
import { getUserStats } from './handlers/get_user_stats';
import { getUserProgress } from './handlers/get_user_progress';

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

  // Kanji management routes
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),

  getKanji: publicProcedure
    .input(getKanjiQuerySchema)
    .query(({ input }) => getKanji(input)),

  // User study progress routes  
  startKanjiStudy: publicProcedure
    .input(startKanjiStudyInputSchema)
    .mutation(({ input }) => startKanjiStudy(input)),

  getUserProgress: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      jlptLevel: jlptLevelSchema.optional()
    }))
    .query(({ input }) => getUserProgress(input.userId, input.jlptLevel)),

  // Review system routes
  getReviewsDue: publicProcedure
    .input(getReviewsDueQuerySchema)
    .query(({ input }) => getReviewsDue(input)),

  submitReview: publicProcedure
    .input(submitReviewInputSchema)
    .mutation(({ input }) => submitReview(input)),

  // Statistics and analytics routes
  getUserStats: publicProcedure
    .input(getUserStatsQuerySchema)
    .query(({ input }) => getUserStats(input)),
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
  console.log(`TRPC Kanji Learning Server listening at port: ${port}`);
}

start();
