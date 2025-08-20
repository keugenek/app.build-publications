import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerUserInputSchema,
  loginUserInputSchema,
  createKanjiInputSchema,
  submitReviewInputSchema,
  getDueReviewsInputSchema,
  getProgressByLevelInputSchema,
  getKanjiByLevelInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createKanji } from './handlers/create_kanji';
import { getKanjiByLevel } from './handlers/get_kanji_by_level';
import { getDueReviews } from './handlers/get_due_reviews';
import { submitReview } from './handlers/submit_review';
import { getProgressByLevel } from './handlers/get_progress_by_level';
import { startLearningKanji } from './handlers/start_learning_kanji';
import { getReviewHistory } from './handlers/get_review_history';

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

  // Authentication endpoints
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Kanji management endpoints
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),

  getKanjiByLevel: publicProcedure
    .input(getKanjiByLevelInputSchema)
    .query(({ input }) => getKanjiByLevel(input)),

  // SRS and Review endpoints
  getDueReviews: publicProcedure
    .input(getDueReviewsInputSchema)
    .query(({ input }) => getDueReviews(input)),

  submitReview: publicProcedure
    .input(submitReviewInputSchema)
    .mutation(({ input }) => submitReview(input)),

  // Progress tracking endpoints
  getProgressByLevel: publicProcedure
    .input(getProgressByLevelInputSchema)
    .query(({ input }) => getProgressByLevel(input)),

  startLearningKanji: publicProcedure
    .input(z.object({
      userId: z.number(),
      kanjiId: z.number()
    }))
    .mutation(({ input }) => startLearningKanji(input.userId, input.kanjiId)),

  // Review history endpoint
  getReviewHistory: publicProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().int().positive().optional().default(50)
    }))
    .query(({ input }) => getReviewHistory(input.userId, input.limit)),
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
  console.log(`Kanji Learning TRPC server listening at port: ${port}`);
}

start();
