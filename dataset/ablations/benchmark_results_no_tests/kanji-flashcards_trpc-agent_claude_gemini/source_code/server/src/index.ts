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
  createUserProgressInputSchema,
  updateUserProgressInputSchema,
  getUserProgressByLevelInputSchema,
  jlptLevelSchema
} from './schema';

// Import handlers
import { createKanji } from './handlers/create_kanji';
import { getKanjiByLevel } from './handlers/get_kanji_by_level';
import { getAllKanji } from './handlers/get_all_kanji';
import { createUserProgress } from './handlers/create_user_progress';
import { updateUserProgress } from './handlers/update_user_progress';
import { getUserProgress } from './handlers/get_user_progress';
import { getProgressSummary } from './handlers/get_progress_summary';
import { getDueReviews } from './handlers/get_due_reviews';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Kanji management
  createKanji: publicProcedure
    .input(createKanjiInputSchema)
    .mutation(({ input }) => createKanji(input)),

  getAllKanji: publicProcedure
    .query(() => getAllKanji()),

  getKanjiByLevel: publicProcedure
    .input(getKanjiByLevelInputSchema)
    .query(({ input }) => getKanjiByLevel(input)),

  // User progress management
  createUserProgress: publicProcedure
    .input(createUserProgressInputSchema)
    .mutation(({ input }) => createUserProgress(input)),

  updateUserProgress: publicProcedure
    .input(updateUserProgressInputSchema)
    .mutation(({ input }) => updateUserProgress(input)),

  getUserProgress: publicProcedure
    .input(getUserProgressByLevelInputSchema)
    .query(({ input }) => getUserProgress(input)),

  // Progress tracking and analytics
  getProgressSummary: publicProcedure
    .input(z.object({
      userId: z.string(),
      jlptLevel: jlptLevelSchema.optional()
    }))
    .query(({ input }) => getProgressSummary(input.userId, input.jlptLevel)),

  // Spaced repetition system
  getDueReviews: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getDueReviews(input.userId)),
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
